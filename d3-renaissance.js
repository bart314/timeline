// vim: ts=2 sw=2
(function () {
  d3.timeline = function() {
    var DISPLAY_TYPES = ["circle", "rect"];

    var scroll = function () {},
        labelFunction = function(label) { return label; },
        navigateLeft = function () {},
        navigateRight = function () {},
        orient = "bottom",
        width = null,
        height = null,
        tickFormat = { format: d3.time.format("%I %p"),
          tickTime: d3.time.hours,
          tickInterval: 1,
          tickSize: 6,
          tickValues: null
        },
        colorCycle = d3.scale.category20(),
        colorPropertyName = null,
        display = "rect",
        beginning = 0,
        labelMargin = 0,
        ending = 0,
        margin = {left: 30, right:30, top: 30, bottom:30},
        hlines = [],
        stacked = false,
        rotateTicks = false,
        itemHeight = 25,
        itemMargin = 5,
        showTimeAxis = true,
        showAxisTop = false,
        timeAxisTick = false,
        timeAxisTickFormat = {stroke: "stroke-dasharray", spacing: "4 10"},
        showAxisHeaderBackground = false,
        showAxisNav = false
   
  var appendTimeAxis = function(g, xAxis, yPosition) {
      if(showAxisHeaderBackground){ appendAxisHeaderBackground(g, 0, 0); }
      if(showAxisNav){ appendTimeAxisNav(g) };

      var axis = g.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + 0 + "," + yPosition + ")")
        .call(xAxis);
  };


  var appendTimeAxisTick = function(g, xAxis, maxStack) {
      g.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + 0 + "," + (margin.top + (itemHeight + itemMargin) * maxStack) + ")")
        .attr(timeAxisTickFormat.stroke, timeAxisTickFormat.spacing)
        .call(xAxis.tickFormat("").tickSize(-(margin.top + (itemHeight + itemMargin) * (maxStack - 1) + 3), 0, 0));
  };

  function timeline (gParent) {
      var g = gParent.append("g");
      var gParentSize = gParent[0][0].getBoundingClientRect();
      var gParentItem = d3.select(gParent[0][0]);

      var width = gParentItem.attr("width");
      var maxStack = g.datum().length + 1
      var yAxisMapping = Array.from({length:g.datum().length}, (x,i) => i+1)
      var scaleFactor = (1/(ending - beginning)) * (width - margin.left - margin.right);

      // draw the axis
      var xScale = d3.time.scale()
        .domain([beginning, ending])
        .range([margin.left, width - margin.right]);

      var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient(orient)
        .tickFormat(tickFormat.format)
        .tickSize(tickFormat.tickSize);

      xAxis.ticks(tickFormat.numTicks || tickFormat.tickTime, tickFormat.tickInterval);

      // draw the chart
      g.each(function(d, i) {
        chartData = d 
        d.forEach( function(datum, index){
          var data = datum.times;

          g.selectAll("svg").data(data).enter()
            .append(function(d, i) {
                return document.createElementNS(d3.ns.prefix.svg, "display" in d? d.display:display);
            })
            .attr("x", getXPos)
            .attr("y", getStackPosition)
            .attr("width", function (d, i) {
              return (d.ending_time - d.starting_time) * scaleFactor;
            })
            .attr("cy", function(d, i) {
                return getStackPosition(d, i) + itemHeight/2;
            })
            .attr("cx", getXPos)
            .attr("r", itemHeight / 2)
            .attr("height", itemHeight)
            .style("fill", function(d, i){
              var dColorPropName;
              if (d.color) return d.color;
              if( colorPropertyName ){
                dColorPropName = d[colorPropertyName];
                if ( dColorPropName ) {
                  return colorCycle( dColorPropName );
                } else {
                  return colorCycle( datum[colorPropertyName] );
                }
              }
              return colorCycle(index);
            })
            .attr("id", function(d, i) { // TODO
              return datum.id //? d.id : "timelineItem_"+index+"_"+i;
            })
          
          //Adding texts on top of the rect's
          g.selectAll("svg").data(data).enter()
            .append("text")
            .attr("x", getXTextPos)
            .attr("y", getStackTextPosition)
            .attr("id", (d,i) => datum.id)
            .text( (d,i) => d.label) 

          if (typeof(datum.icon) !== "undefined") {
            gParent.append("image")
              .attr("class", "timeline-label")
              .attr("transform", "translate("+ 0 +","+ (margin.top + (itemHeight + itemMargin) * yAxisMapping[index])+")")
              .attr("xlink:href", datum.icon)
              .attr("width", margin.left)
              .attr("height", itemHeight);
          }

          function getStackPosition(d, i) {
              return margin.top + (itemHeight + itemMargin) * yAxisMapping[index];
          }

          function getStackTextPosition(d, i) {
              return margin.top + (itemHeight + itemMargin) * yAxisMapping[index] + itemHeight * 0.75;
          }
        }); // BB: end forEach loop

        // BB: Line to seperate the different categories
        hlines.forEach ( pos => {
          var lineYAxis = ( itemHeight + itemMargin / 2 + margin.top + (itemHeight + itemMargin) * pos);
          gParent.append("svg:line")
            .attr("class", "row-separator")
            .attr("x1", 0 + margin.left)
            .attr("x2", width - margin.right)
            .attr("y1", lineYAxis)
            .attr("y2", lineYAxis)
            .attr("stroke-width", 1)
            .attr("stroke", "#0f0");
        })
      }); // end g.each()

      var belowLastItem = (margin.top + (itemHeight + itemMargin) * maxStack);
      var aboveFirstItem = margin.top;
      var timeAxisYPosition = showAxisTop ? aboveFirstItem : belowLastItem;
      if (showTimeAxis) { appendTimeAxis(g, xAxis, timeAxisYPosition); }
      if (timeAxisTick) { appendTimeAxisTick(g, xAxis, maxStack); }

      // BB Bewegende verticale lijn
      gParent.append("svg:line")
         .attr("id", "moveLine")
         .attr("x1", -1)
         .attr("x2", -1)
         .attr("y1", 0)
         .attr("y1", belowLastItem)
         .attr("stroke-width", 1)
         .attr("stroke", 'green')
         .style("stroke-dasharray", (5,5))
      gParent.append("svg:rect")
         .attr("id","moveTextBox")
         .attr("x", -100)
         .attr("y", -100)
         .attr("width", 50)
         .attr("height", itemHeight)
         .attr("label", "test")
         .style("fill", "rgb(0,0,255)")
         .style("stroke-width", 1)
         .style("stroke", "rgb(0,0,0)")
      gParent.append("text")
         .attr("id", "moveText")
         .attr("x", -100)
         .attr("y", -100)
         .style("fill","white")
         .text("")

     d3.select("#timeline").on("mousemove", function() {
	     let pos = d3.mouse(this);
       let dy = ending.getFullYear() - beginning.getFullYear()
       let dx = width-margin.left-margin.right
       let yr = parseInt(beginning.getFullYear() + (dy/dx)*(pos[0]-margin.left))

       d3.select("#moveLine")
         .attr("x1", pos[0])
         .attr("x2", pos[0])
      d3.select("#moveText")
         .attr("x", pos[0]+14)
         .attr("y", pos[1]+14+itemHeight/2)
         .text(yr)
       d3.select("#moveTextBox")
         .attr("x", pos[0]+10)
         .attr("y", pos[1]+10)
	   }).on('mouseleave', function() { 
       d3.select("#moveLine")
         .attr("x1", -1)
         .attr("x2", -1)
       d3.select("#moveTextBox")
         .attr("x", -100)
         .attr("y", -100)
     } )

      if (width > gParentSize.width) {
        var move = function() {
          var x = Math.min(0, Math.max(gParentSize.width - width, d3.event.translate[0]));
          zoom.translate([x, 0]);
          g.attr("transform", "translate(" + x + ",0)");
          scroll(x*scaleFactor, xScale);
        };

        var zoom = d3.behavior.zoom().x(xScale).on("zoom", move);

        gParent
          .attr("class", "scrollable")
          .call(zoom);
      }

      var gSize = g[0][0].getBoundingClientRect();
      setHeight();

      function getXPos(d, i) {
        return margin.left + (d.starting_time - beginning) * scaleFactor;
      }

      function getXTextPos(d, i) {
        return margin.left + (d.starting_time - beginning) * scaleFactor + 5;
      }

      function setHeight() {
        // set height based off of item height
        height = gSize.height + gSize.top - gParentSize.top;
        // set bounding rectangle height
        d3.select(gParent[0][0]).attr("height", height);
      }
    } // end timeline

    // SETTINGS
    timeline.hlines = function (lines) {
      if (!arguments.length) return hlines
      hlines = lines
      return timeline
    }

   timeline.margin = function (p) {
      if (!arguments.length) return margin;
      margin = p;
      return timeline;
    };

    timeline.itemHeight = function (h) {
      if (!arguments.length) return itemHeight;
      itemHeight = h;
      return timeline;
    };

    timeline.itemMargin = function (h) {
      if (!arguments.length) return itemMargin;
      itemMargin = h;
      return timeline;
    };

    timeline.height = function (h) {
      if (!arguments.length) return height;
      height = h;
      return timeline;
    };

    timeline.width = function (w) {
      if (!arguments.length) return width;
      width = w;
      return timeline;
    };

    timeline.display = function (displayType) {
      if (!arguments.length || (DISPLAY_TYPES.indexOf(displayType) == -1)) return display;
      display = displayType;
      return timeline;
    };

    timeline.labelFormat = function(f) {
      if (!arguments.length) return labelFunction;
      labelFunction = f;
      return timeline;
    };

    timeline.tickFormat = function (format) {
      if (!arguments.length) return tickFormat;
      tickFormat = format;
      return timeline;
    };

    timeline.scroll = function (scrollFunc) {
      if (!arguments.length) return scroll;
      scroll = scrollFunc;
      return timeline;
    };

    timeline.colors = function (colorFormat) {
      if (!arguments.length) return colorCycle;
      colorCycle = colorFormat;
      return timeline;
    };

    timeline.beginning = function (b) {
      if (!arguments.length) return beginning;
      beginning = b;
      return timeline;
    };

    timeline.ending = function (e) {
      if (!arguments.length) return ending;
      ending = e;
      return timeline;
    };

    timeline.labelMargin = function (m) {
      if (!arguments.length) return labelMargin;
      labelMargin = m;
      return timeline;
    };

    timeline.rotateTicks = function (degrees) {
      if (!arguments.length) return rotateTicks;
      rotateTicks = degrees;
      return timeline;
    };

    timeline.stack = function () {
      stacked = !stacked;
      return timeline;
    };

    timeline.showTimeAxis = function () {
      showTimeAxis = !showTimeAxis;
      return timeline;
    };


    timeline.showTimeAxisTick = function () {
      timeAxisTick = !timeAxisTick;
      return timeline;
    };

    timeline.navigate = function (navigateBackwards, navigateForwards) {
      if (!arguments.length) return [navigateLeft, navigateRight];
      navigateLeft = navigateBackwards;
      navigateRight = navigateForwards;
      showAxisNav = !showAxisNav;
      return timeline;
    };

    return timeline;
  };
})();

