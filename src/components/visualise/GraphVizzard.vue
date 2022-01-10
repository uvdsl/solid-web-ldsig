<template>
  <div class="graphVizzard">
    <svg id="svgGraph" ref="svgRef" />
  </div>
</template>

<script>
import * as d3 from "d3";
export default {
  label: "GraphVizzard",
  components: {},
  props: {
    links: Array,
    nodes: Array
  },
  computed: {
    // array of {name, verified}
    // nodes() {
    //   return Array.from(
    //     new Set(this.links.map(link => [link.source, link.target]).flat())
    //   ).map(uri => ({ label: uri }));
    // }
  },
  watch: {
    links() {
      this.update();
    }
  },
  data() {
    return {
      simulation: undefined,
      svg: undefined,
      g_link_selection: undefined,
      g_node_selection: undefined,
      dragger: d3
        .drag()
        .on("start", this.dragstarted)
        .on("drag", this.dragged)
        .on("end", this.dragended)
    };
  },
  mounted() {
    this.svg = d3.select("#svgGraph");
    const svg_pos = this.$refs.svgRef.getBoundingClientRect();
    const svg_x_center = svg_pos.x + svg_pos.width / 2;
    const svg_y_center = (svg_pos.y + svg_pos.height / 2) * 0.5;
    // simulation
    this.simulation = d3
      .forceSimulation(this.nodes)
      .force(
        "link",
        d3
          .forceLink()
          .id(d => d.label) // set the id to "label" s.t. (force) links can be established by label, not by index
          .links(this.links)
      )
      .force("charge", d3.forceManyBody().strength(-30000))
      .force("center", d3.forceCenter(svg_x_center, svg_y_center)) // width, height
      .on("tick", this.ticked);

    this.svg.call(
      d3.zoom().on("zoom", () => {
        this.svg
          .selectAll(".nodes")
          .attr("transform", d3.event.transform.toString());
        this.svg
          .selectAll(".links")
          .attr("transform", d3.event.transform.toString());
      })
    );

    this.g_link_selection = this.svg
      .append("g")
      .attr("class", "links")
      .attr("stroke", "#999")
      .attr("stroke-width", 5)
      .attr("fill-opacity", 0)
      .selectAll("path");

    this.g_node_selection = this.svg
      .append("g")
      .attr("class", "nodes")
      .attr("fill", "currentColor")
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round")
      .selectAll("g");

    this.svg
      .append("svg:defs")
      .append("svg:marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      // .attr("refY", -100) //so that it comes towards the center.
      .attr("markerWidth", 5)
      .attr("markerHeight", 5)
      .attr("orient", "auto")
      .append("svg:path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#888");

    this.update();
  },
  methods: {
    update() {
      // GRAPHICS
      this.g_node_selection = this.g_node_selection.data(this.nodes).join(
        enter => {
          const selection = enter.append("g").call(this.dragger);
          const width = 395;
          const height = 45;
          const border = 5;
          selection
            .append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("x", -(width + border) / 2)
            .attr("y", -(height + border) / 2)
            .attr("rx", "10px") // round corners
            .attr("stroke", "white")
            .attr("stroke-width", border)
            .attr("fill", this.color);

          selection
            .append("text")
            .text(d => d.label.split("_")[0])
            .attr("color", "white")
            .style("text-anchor", "middle");

          return selection;
        },
        update => update,
        exit => exit.remove()
      );

      // GRAPHICS
      this.g_link_selection = this.g_link_selection.data(this.links).join(
        enter => enter.append("path").attr("marker-end", "url(#arrow)"), //attach the arrow from defs,
        update => update,
        exit => exit
      );

      // SIMULATION
      this.simulation.nodes(this.nodes);
      this.simulation.force("link").links(this.links);
      this.simulation.alpha(0.05).restart();
    },

    drawPath(source, target) {
      // source higher than target
      const offset_y = source.y >= target.y ? -50 : 55;
      // source right of target
      const offset_x = source.x >= target.x ? -25 : 25;
      return `M ${source.x + offset_x} ${source.y} 
        C ${source.x + offset_x} ${source.y + 2*offset_y}, 
          ${target.x - offset_x} ${target.y - 2*offset_y}, 
          ${target.x - offset_x} ${target.y - offset_y}`;
    },

    ticked() {
      this.g_link_selection.attr("d", d => this.drawPath(d.source, d.target));
      this.g_node_selection.attr("transform", d => `translate(${d.x},${d.y})`);
    },

    dragstarted(d) {
      if (!d3.event.active) this.simulation.alphaTarget(0.25).restart();
      d.fx = d.x;
      d.fy = d.y;
    },

    dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    },

    dragended(d) {
      if (!d3.event.active) this.simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    },

    color(d) {
      // compute conditionalise this one ...
      if (!d.isValid) {
        return "darkred";
      }
      return "darkgreen";
    }
  }
};
</script>

<style lang="scss" scoped>
.hello {
  display: flex;
  justify-content: center;
  align-content: center;
  width: 90vw;
  height: 90vh;
}
#svgGraph {
  width: 100%;
  min-height: 700px;
}
</style>
