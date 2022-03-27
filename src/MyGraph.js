/** @format */

import Cytoscape from "cytoscape";
import cytoscapeCoseBilkent from "cytoscape-cose-bilkent";
import React from "react";
import ReactDOM from "react-dom";
import cytoscape_dom_node from "cytoscape-dom-node";
import * as lodash from "lodash";

import CyReact from "cytoscape-react";
// skypack-cdn load above doesn't work, get from temp_get_cytoscape_react() for now
// import CyDomNode from "https://cdn.skypack.dev/cytoscape-dom-node@1.1.0";
// Cytoscape.use(CyDomNode);
// const CyReact = temp_get_cytoscape_react();

Cytoscape.use(cytoscapeCoseBilkent);

class MyGraphWrapper extends CyReact.GraphWrapper {
  constructor() {
    super();

    this._debounced_layout = lodash.debounce(
      () => {
        this._layout = this._cy.layout({ name: "cose-bilkent" });
        this._layout.run();
      },
      50,
      { trailing: true }
    );
  }

  layout(params = {}) {
    if (this._layout) {
      this._layout.stop();
      this._layout = undefined;
    }

    this._debounced_layout(params);
  }

  cyReady(cy) {
    this._cy = cy;
  }

  graphElementDidMount(el_component) {
    this.layout();
  }

  graphElementDidUpdate(el_component) {
    this.layout();
  }
}

export default class MyGraph extends CyReact.Graph {
  render() {
    return (
      <MyGraphWrapper>
        <CyReact.NodeWrapper key="foo" id="foo">
          <CyReact.Node />
        </CyReact.NodeWrapper>
        <CyReact.NodeWrapper key="bar" id="bar">
          <CyReact.Node />
        </CyReact.NodeWrapper>
        <CyReact.NodeWrapper key="bazzz" id="bazzz">
          <CyReact.Node />
        </CyReact.NodeWrapper>

        <CyReact.EdgeWrapper
          key="foo_bar"
          id="foo_bar"
          source="foo"
          target="bar"
        />
        <CyReact.EdgeWrapper
          key="bar_bazzz"
          id="bar_bazzz"
          source="bar"
          target="bazzz"
        />
      </MyGraphWrapper>
    );
  }
}

// temporary copy of cytoscape-react, because skypack-cdn load doesn't work

function temp_get_cytoscape_react() {
  class Edge extends React.Component {
    render() {
      return null;
    }
  }

  class EdgeWrapper extends React.Component {
    constructor() {
      super();

      this.state = {
        missing: null,
      };
    }

    componentDidMount() {
      let props = this.props;

      if (props.cy) this._init_cy();
    }

    componentDidUpdate(prev_props) {
      let props = this.props;

      if (props.cy && !prev_props.cy) this._init_cy();
    }

    _init_cy() {
      let props = this.props;

      let missing =
        2 -
        props.cy.getElementById(props.source).length -
        props.cy.getElementById(props.target).length;

      this.setState({ missing: missing });

      if (missing > 0) {
        this._wait_for_missing_cb = function (ev) {
          let target = ev.target;
          let id = target.id();
          let props = this.props;
          let state = this.state;
          let missing = state.missing;
          if (id === props.source || id === props.target) {
            missing -= 1;

            this.setState({ missing: missing });

            if (missing === 0) {
              props.cy.off("add", "node", this._wait_for_missing_cb);
              this._wait_for_missing_cb = undefined;
            }
          }
        }.bind(this);

        props.cy.on("add", "node", this._wait_for_missing_cb);
      }
    }

    render() {
      let props = this.props;
      let state = this.state;

      if (state.missing === 0) {
        if (props.cy.getElementById(props.id).length === 0) {
          props.cy.add({
            data: props,
          });
        }
      }

      return (
        <div className="cytoscape-react-edge">
          {props.children ? React.cloneElement(props.children, props) : null}
        </div>
      );
    }
  }

  class Graph extends React.Component {}

  class GraphWrapper extends React.Component {
    constructor() {
      super();

      this.state = { cy: null };
    }

    componentDidMount() {
      let props = this.props;

      let cy_params = Object.assign(
        {
          container: ReactDOM.findDOMNode(this).querySelector(
            ".cytoscape-react-cy-container"
          ),
          style: [
            {
              selector: "node",
              style: {
                "background-opacity": 0,
                shape: "rectangle",
              },
            },
          ],
        },
        props.cy_params || {}
      );

      let cy = Cytoscape(cy_params);
      cy.domNode({
        dom_container: ReactDOM.findDOMNode(this).querySelector(
          ".cytoscape-react-nodes-and-edges"
        ),
      });

      this.setState({ cy: cy });

      this.cyReady(cy);
    }

    render() {
      let state = this.state;

      let nodes_and_edges = state.cy
        ? this.props.children.map((c) =>
            React.cloneElement(c, {
              cy: state.cy,
              _cdm_cb: this.graphElementDidMount.bind(this),
              _cdu_cb: this.graphElementDidUpdate.bind(this),
            })
          )
        : [];

      return (
        <div>
          <div className="cytoscape-react-cy-container">
            <div className="cytoscape-react-nodes-and-edges">
              {nodes_and_edges}
            </div>
          </div>
        </div>
      );
    }

    cyReady(_cy) {}

    graphElementDidMount(_el_component) {}

    graphElementDidUpdate(_el_component) {}
  }

  class Node extends React.Component {
    componentDidMount() {
      let props = this.props;

      if (props._cdm_cb) props._cdm_cb(this);
    }

    componentDidUpdate() {
      let props = this.props;

      if (props._cdu_cb) props._cdu_cb(this);
    }

    render() {
      return (
        <div className="cytoscape-react-node-default">{this.props.id}</div>
      );
    }
  }

  class NodeWrapper extends React.Component {
    componentDidMount() {
      let props = this.props;

      if (props.cy) this._init_cy();
    }

    componentDidUpdate(prev_props) {
      let props = this.props;

      if (props.cy && !prev_props.cy) this._init_cy();
    }

    _init_cy() {
      let props = this.props;

      if (!props.cy) return;

      if (props.cy.getElementById(props.id).length === 0)
        props.cy.add({
          data: Object.assign({}, props, {
            dom: ReactDOM.findDOMNode(this),
          }),
        });
    }

    render() {
      let props = this.props;

      return (
        <div className="cytoscape-react-node">
          {props.children ? React.cloneElement(props.children, props) : null}
        </div>
      );
    }
  }

  return { Graph, GraphWrapper, Node, NodeWrapper, Edge, EdgeWrapper };
}
