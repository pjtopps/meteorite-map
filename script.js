document.addEventListener("DOMContentLoaded", function() {

  //set constants, create svg, set variables used to draw map
  const height = $("#map").height();
  const width = $("#map").width();

  var map = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height);

  var projection = d3.geoMercator()
    .translate([width/2, height/2])
    .scale(200);

  var path = d3.geoPath()
    .projection(projection);

  d3.queue()
    .defer(d3.json, "https://d3js.org/world-50m.v1.json")
    .defer(d3.json, "https://raw.githubusercontent.com/FreeCodeCamp/ProjectReferenceData/master/meteorite-strike-data.json")
    .await(ready);

  //DATA RECIEVED:
  function ready(error, world, meteorites) {

    var meteorites = meteorites.features;
    var countries = topojson.feature(world, world.objects.countries).features;

    //draw map
    map.selectAll(".country").data(countries).enter().append("path")
      .attr("class", "country")
      .attr("d", path);

    //scale to determine size of meteorite circles
    var sizeRange = d3.extent(meteorites, (d) => parseInt(d.properties.mass));
    var radiusScale = d3.scaleSqrt()
      .range([1, 200])
      .domain(sizeRange);

    //maps meteorite circles onto map
    var points = map.selectAll(".hit").data(meteorites).enter().append("circle")
      .attr("class", "hit")
      .attr("cx", (d) => {
        var coords = projection([d.properties.reclong, d.properties.reclat]);
        return coords[0];
      })
      .attr("cy", (d) => {
        var coords = projection([d.properties.reclong, d.properties.reclat]);
        return coords[1];
      })
      .attr("r", (d) => {
        var rad = radiusScale(parseInt(d.properties.mass));
        return rad;
      });

    //hover feature
    points
      .on("mouseover", function(d) {
        d3.select(this).classed("hovered", true);
        var info = document.getElementById("tooltip");
        info.style.display = "block";

        if (d3.event.pageX > 0.9 * width) {
          info.style.left = (d3.event.pageX - 150) + "px";
          info.style.top = d3.event.pageY + "px";
        }
        else {
          info.style.left = (d3.event.pageX + 15) + "px";
          info.style.top = d3.event.pageY + "px";
        }

        let yr = d.properties.year.slice(0, 4);
        info.innerHTML = "<strong>Year: </strong>" + yr + "<br><strong>Mass: </strong>" + d.properties.mass + "<br><strong>Name: </strong>" + d.properties.name;
      })
      .on("mouseout", function(d) {
        d3.select(this).classed("hovered", false);
        var info = document.getElementById("tooltip");
        info.style.display = "none";
      });

    //ensures smaller circles overlay bigger ones so they can be hovered over
    points.sort(function(x, y) {
      return d3.ascending(x.properties.mass, y.properties.mass);
    });

    //zoom stuff..
    var zoomed = function() {
      console.log(d3.event.transform);
      map.selectAll("path").attr("transform", d3.event.transform);
      map.selectAll("circle").attr("transform", d3.event.transform);
    }

    var zoom = d3.zoom()
      .scaleExtent([1, 6])
      .on("zoom", zoomed);

    map.call(zoom);

  }
});
