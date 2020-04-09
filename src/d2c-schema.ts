/**
 * @desc
 *
 * @使用场景
 *
 * @coder.yang2010@gmail.com
 * @Date    2020/4/9
 **/
export interface PageTree {
  // 节点组件名称
  componentName: 'Page';
  // 节点 ID 标识
  id?: string;
  // 节点属性
  props: NodeProps;
  // 子节点
  children?: NodeSchema[];
  // 节点坐标尺寸描述
  rect?: Rect;
  // 节点识别
  smart?: Smart;
  // 节点状态数据
  state?: {
    [key: string]: CompositeValue;
  };
  // 节点自定义方法
  methods?: {
    [key: string]: Function;
  };
  // 节点生命周期
  lifeCycles?: {
    [key: string]: Function;
  };
  // 异步数据源描述
  dataSource?: {
    list: DataSourceConfig[];
  };
  // 文件名
  fileName?: string;
}

interface BlockTree {
  // 节点组件名称
  componentName: 'Block';
  // 节点 ID 标识
  id?: string;
  // 节点属性
  props: NodeProps;
  // 子节点
  children?: Node[];
  // 节点坐标尺寸描述
  rect?: Rect;
  // 节点识别
  smart?: Smart;
  // 节点状态数据
  state?: {
    [key: string]: CompositeValue;
  };
  // 节点自定义方法
  methods?: {
    [key: string]: Function;
  };
  // 节点生命周期
  lifeCycles?: {
    [key: string]: Function;
  };
  // 异步数据源描述
  dataSource?: {
    list: DataSourceConfig[];
  };
  // 文件名
  fileName?: string;
}

export interface NodeSchema {
  // 节点组件名称
  componentName: NodeType;
  // 节点 ID 标识
  id?: string;
  // 节点属性
  props: NodeProps;
  // 子节点
  children?: NodeSchema[];
  // 节点坐标尺寸描述
  rect?: Rect;
  // 节点识别
  smart?: Smart;
  // 节点是否渲染
  condition?: CompositeValue;
  // 循环数据源配置
  loop?: CompositeValue;
  // 循环数据参数（数据变量名 + 索引）
  loopArgs?: [string, string];
}



// JSON 基本类型
export type JSONValue = boolean | string | number | null | JSONArray | JSONObject;
interface JSONArray extends Array<JSONValue> {}
interface JSONObject {
  [key: string]: JSONValue;
}
// 复合类型
export type CompositeValue = JSONValue | Function | CompositeArray | CompositeObject;
interface CompositeArray extends Array<CompositeValue> {}
interface CompositeObject {
  [key: string]: CompositeValue;
}
// 数据请求配置
export interface DataSourceConfig {
  id: string;
  isInit: boolean | string;
  type: 'fetch' | 'jsonp';
  options: {
    uri: string;
    [otherOption: string]: CompositeValue;
  };
  dataHandler?: CompositeValue;
  [otherKey: string]: CompositeValue;
}

// 基础节点类型
type NodeType = 'Text' | 'Image' | 'Div' ;

// 节点 Rect 坐标、尺寸描述
interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
// 节点 Props
interface NodeProps {
  style: {
    [key: string]: JSONValue;
  };
  // 图片地址属性预留
  src?: string;
  // 文本内容
  text?: string;
  // 图层 class 类名
  className?: string;
  [key: string]: CompositeValue;
}


// Open Smart Part

// 节点模型类型识别
interface NodeIdentification {
  // 业务组件
  bizComponent: string;
  // 业务模块（区块）
  bizModule: string;
  // 原子业务模块（区块）
  bizAtomModule: string;
  // 基础组件
  baseComponent: string;
  // 基础模块（区块）
  baseModule: string;
  // 字段绑定
  fieldBind: JSONValue;
  // 单一的业务数据实体
  bizEntity: string;
}

// 内置图层协议名
type ProtocolName = 'merge' | 'group' | 'classPre' | 'class' | 'imgExport' |
  'component' | 'module' | 'atomModule' |
  'field' | 'loop' | 'logic' | 'entity';

// 图层协议值
interface LayerProtocolValue {
  type: string;
  param?: JSONValue;
}
// 图层协议
interface LayerProtocol {
  [key: string]: LayerProtocolValue | Array<LayerProtocolValue>;
}
// imgcook 智能字段
interface Smart {
  layerProtocol: LayerProtocol;
  nodeIdentification: NodeIdentification;
  nodeCustom: JSONValue;
}

// model 分类、目标检测模型预测接口
interface ModelPredict {
  label: string;
  score: number;
  rect?: Rect;
  meta?: JSONValue;
}
