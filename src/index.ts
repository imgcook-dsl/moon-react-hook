/**
 * warning 生成内容   exports.default  ==> module.exports;
 *
 *
 * @param schema
 * @param option
 */
import {
  CompositeValue,
  DataSourceConfig,
  JSONValue, NodeSchema,
  PageTree,
} from '@/d2c-schema';

export default function (
  schema: PageTree,
  option: {
    prettier: any;
    responsive: {
      width: number;
    };
    utils?: {
      [name: string]: string;
    };
  },
): {
  panelDisplay: PanelItem[];
  noTemplate?: boolean;
} {
  const {prettier} = option;

  // imports
  const imports: string[] = [];

  // inline style
  const style = {};

  // Global Public Functions
  const utils = [];

  // Classes
  const classes = [];

  // 1vw = width / 100
  const _w = option.responsive.width / 100;

  // generate render xml
  const generateRender = (schema: NodeSchema|PageTree) => {
    const type = schema.componentName.toLowerCase();
    const className = schema.props && schema.props.className;
    const classString = className ? ` style={styles.${className}}` : '';

    if (className) {
      style[className] = parseStyle(schema.props.style, _w);
    }

    let xml;
    let props = '';

    Object.keys(schema.props).forEach((key) => {
      if (['className', 'style', 'text', 'src'].indexOf(key) === -1) {
        props += ` ${key}={${parseProps(schema.props[key])}}`;
      }
    });

    switch (type) {
      case 'text':
        const innerText = parseProps(schema.props.text, true);
        xml = `<span${classString}${props}>${innerText}</span>`;
        break;
      case 'image':
        const source = parseProps(schema.props.src);
        xml = `<img${classString}${props} src={${source}} />`;
        break;
      case 'div':
      case 'page':
      case 'block':
        if (schema.children && schema.children.length) {
          xml = `<div${classString}${props}>${transform(
            schema.children,
          )}</div>`;
        } else {
          xml = `<div${classString}${props} />`;
        }
        break;
    }

    //@ts-ignore
    if (schema.loop) {
      //@ts-ignore
      xml = parseLoop(schema.loop, schema.loopArgs, xml);
    }
    //@ts-ignore
    if (schema.condition) {
      //@ts-ignore
      xml = parseCondition(schema.condition, xml);
    }
    //@ts-ignore
    if (schema.loop || schema.condition) {
      xml = `{${xml}}`;
    }

    return xml;
  };

  // parse schema
  const transform = (schema: PageTree|NodeSchema[]|NodeSchema) => {
    let result = '';

    if (Array.isArray(schema)) {
      schema.forEach((layer) => {
        result += transform(layer);
      });
    } else {
      let nodeSchema = schema as PageTree;

      const type = nodeSchema.componentName.toLowerCase();

      if (['page', 'block'].indexOf(type) !== -1) {
        // 容器组件处理: state/method/dataSource/lifeCycle/render
        const states = [];
        const lifeCycles = [];
        const methods = [];
        const init = [];
        const render = [`render(){ return (`];
        let classData = [
          `class ${nodeSchema.componentName}_${classes.length} extends Component {`,
        ];

        if (nodeSchema.state) {
          states.push(`state = ${toString(nodeSchema.state)}`);
        }

        if (nodeSchema.methods) {
          Object.keys(nodeSchema.methods).forEach((name) => {
            const {params, content} = parseFunction(nodeSchema.methods[name]);
            methods.push(`${name}(${params}) {${content}}`);
          });
        }

        if (nodeSchema.dataSource && Array.isArray(nodeSchema.dataSource.list)) {
          nodeSchema.dataSource.list.forEach((item) => {
            if (typeof item.isInit === 'boolean' && item.isInit) {
              init.push(`this.${item.id}();`);
            } else if (typeof item.isInit === 'string') {
              init.push(
                `if (${parseProps(item.isInit)}) { this.${item.id}(); }`,
              );
            }
            methods.push(parseDataSource(item, imports));
          });

          //@ts-ignore
          if (nodeSchema.dataSource.dataHandler) {
            const {params, content} = parseFunction(
              //@ts-ignore
              nodeSchema.dataSource.dataHandler,
            );
            methods.push(`dataHandler(${params}) {${content}}`);
            init.push(`this.dataHandler()`);
          }
        }

        if (nodeSchema.lifeCycles) {
          if (!nodeSchema.lifeCycles['_constructor']) {
            lifeCycles.push(
              `constructor(props, context) { super(); ${init.join('\n')}}`,
            );
          }

          Object.keys(nodeSchema.lifeCycles).forEach((name) => {
            const {params, content} = parseFunction(nodeSchema.lifeCycles[name]);

            if (name === '_constructor') {
              lifeCycles.push(
                `constructor(${params}) { super(); ${content} ${init.join(
                  '\n',
                )}}`,
              );
            } else {
              lifeCycles.push(`${name}(${params}) {${content}}`);
            }
          });
        }

        render.push(generateRender(nodeSchema));
        render.push(`);}`);

        classData = classData
          .concat(states)
          .concat(lifeCycles)
          .concat(methods)
          .concat(render);
        classData.push('}');

        classes.push(classData.join('\n'));
      } else {
        result += generateRender(schema);
      }
    }

    return result;
  };

  if (option.utils) {
    Object.keys(option.utils).forEach((name) => {
      utils.push(`const ${name} = ${option.utils[name]}`);
    });
  }

  // start parse schema
  transform(schema);

  const prettierOpt = {
    parser: 'babel',
    printWidth: 120,
    singleQuote: true,
  };

  return {
    panelDisplay: [
      {
        panelName: `index.jsx`,
        panelValue: prettier.format(
          `
          'use strict';

          import React, { Component } from 'react';
          ${imports.join('\n')}
          import styles from './style.js';
          ${utils.join('\n')}
          ${classes.join('\n')}
          export default ${schema.componentName}_0;
        `,
          prettierOpt,
        ),
        panelType: 'js',
      },
      {
        panelName: `style.js`,
        panelValue: prettier.format(
          `export default ${toString(style)}`,
          prettierOpt,
        ),
        panelType: 'js',
      },
    ],
    noTemplate: true,
  };
}

export type FileName = string;
export type CodeContent = string;

export interface PanelItem {
  panelName: FileName;
  panelValue: CodeContent;
  panelType: 'js' | 'html' | 'css';
}

/**
 *
 * @param style 将要转换的style;
 * @param baseRate 转换汇率;   一个基本单位的值; eg: 设计稿是735 ,  则为735/100
 */
// convert to responsive unit, such as vw
const parseStyle = (
  style: {
    [key: string]: JSONValue;
  },
  baseRate: number,
) => {
  for (let key in style) {
    switch (key) {
      case 'fontSize':
      case 'marginTop':
      case 'marginBottom':
      case 'paddingTop':
      case 'paddingBottom':
      case 'height':
      case 'top':
      case 'bottom':
      case 'width':
      case 'maxWidth':
      case 'left':
      case 'right':
      case 'paddingRight':
      case 'paddingLeft':
      case 'marginLeft':
      case 'marginRight':
      case 'lineHeight':
      case 'borderBottomRightRadius':
      case 'borderBottomLeftRadius':
      case 'borderTopRightRadius':
      case 'borderTopLeftRadius':
      case 'borderRadius':
        style[key] = (parseInt(style[key]+"") / baseRate).toFixed(2) + 'vw';
        break;
    }
  }

  return style;
};

/**
 * 是否为表达式;
 * @param value
 */
const isExpression = (value) => {
  return /^\{\{.*\}\}$/.test(value);
};

/**
 * 解析props
 * @param value
 * @param isReactNode
 */
// parse layer props(static values or expression)
const parseProps = (
  value: string | CompositeValue,
  isReactNode = false,
): string => {
  if (typeof value === 'string') {
    if (isExpression(value)) {
      if (isReactNode) {
        return value.slice(1, -1);
      } else {
        return value.slice(2, -2);
      }
    }
    if (isReactNode) {
      return value;
    } else {
      return `'${value}'`;
    }
  } else if (typeof value === 'function') {
    const {params, content} = parseFunction(value);
    return `(${params}) => {${content}}`;
  }
};

// parse condition: whether render the layer
const parseCondition = (condition, render) => {
  if (typeof condition === 'boolean') {
    return `${condition} && ${render}`;
  } else if (typeof condition === 'string') {
    return `${condition.slice(2, -2)} && ${render}`;
  }
};

// parse loop render
const parseLoop = (loop, loopArg, render) => {
  let data;
  let loopArgItem = (loopArg && loopArg[0]) || 'item';
  let loopArgIndex = (loopArg && loopArg[1]) || 'index';

  if (Array.isArray(loop)) {
    data = toString(loop);
  } else if (isExpression(loop)) {
    data = loop.slice(2, -2);
  }

  // add loop key
  const tagEnd = render.match(/^<.+?\s/)[0].length;
  render = `${render.slice(0, tagEnd)} key={${loopArgIndex}}${render.slice(
    tagEnd,
  )}`;

  // remove `this`
  const re = new RegExp(`this.${loopArgItem}`, 'g');
  render = render.replace(re, loopArgItem);

  return `${data}.map((${loopArgItem}, ${loopArgIndex}) => {
      return (${render});
    })`;
};

// parse async dataSource
const parseDataSource = (data: DataSourceConfig, imports: string[]): string => {
  const name = data.id;
  const {uri, method, params} = data.options;
  const action = data.type;
  let payload = {};

  switch (action) {
    case 'fetch':
      if (imports.indexOf(`import {fetch} from whatwg-fetch`) === -1) {
        imports.push(`import {fetch} from 'whatwg-fetch'`);
      }
      payload = {
        method: method,
      };

      break;
    case 'jsonp':
      if (imports.indexOf(`import {fetchJsonp} from fetch-jsonp`) === -1) {
        imports.push(`import jsonp from 'fetch-jsonp'`);
      }
      break;
  }

  Object.keys(data.options).forEach((key) => {
    if (['uri', 'method', 'params'].indexOf(key) === -1) {
      payload[key] = toString(data.options[key]);
    }
  });

  // params parse should in string template
  if (params) {
    payload = `${toString(payload).slice(0, -1)} ,body: ${
      isExpression(params) ? parseProps(params) : toString(params)
    }}`;
  } else {
    payload = toString(payload);
  }

  let result = `{
      ${action}(${parseProps(uri)}, ${toString(payload)})
        .then((response) => response.json())
    `;

  if (data.dataHandler) {
    if (typeof data.dataHandler === 'function') {
      const {params, content} = parseFunction(data.dataHandler);
      result += `.then((${params}) => {${content}})
        .catch((e) => {
          console.log('error', e);
        })
      `;
    } else {
      throw new Error(`暂不支持非方法类型; data.dataHandler`);
    }
  }

  result += '}';

  return `${name}() ${result}`;
};

const toString = (value) => {
  if ({}.toString.call(value) === '[object Function]') {
    return value.toString();
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, (key, value) => {
      if (typeof value === 'function') {
        return value.toString();
      } else {
        return value;
      }
    });
  }

  return String(value);
};

// parse function, return params and content
const parseFunction = (func: Function) => {
  const funcString = func.toString();
  const params = funcString.match(/\([^\(\)]*\)/)[0].slice(1, -1);
  const content = funcString.slice(
    funcString.indexOf('{') + 1,
    funcString.lastIndexOf('}'),
  );
  return {
    params,
    content,
  };
};
