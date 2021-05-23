function isNumeric(str) {
  if (typeof str != "string") return false // we only process strings!  
  return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}


var nf = new Intl.NumberFormat();


var countryMatch = []
countryMatch['AT'] = 'Austria'
countryMatch['BE'] = 'Belgium'
countryMatch['CZ'] = 'Czechia'
countryMatch['DE'] = 'Germany'
countryMatch['DK'] = 'Denmark'
countryMatch['ES'] = 'Spain'
countryMatch['FI'] = 'Finland'
countryMatch['FR'] = 'France'
countryMatch['HU'] = 'Hungary'
countryMatch['IT'] = 'Italy'
countryMatch['LT'] = 'Lithuania'
countryMatch['NL'] = 'Netherlands'
countryMatch['NO'] = 'Norway'
countryMatch['PL'] = 'Poland'
countryMatch['SE'] = 'Sweden'
countryMatch['TR'] = 'Turkey'
countryMatch['UK'] = 'United Kingdom'
countryMatch['OT'] = 'Others'



d3.csv("/src/assets/student_data_2008.csv", function (error, data) {
  $('#vis').removeClass('hidden')
  // filter faulty data
  data = data.filter(function (d) { return d.MOBILITYTYPE === 'S' && d.AGE && isNumeric(d.AGE) && !d.AGE.includes(' ') && ['1', '2', '3', '4', '5', '6', '7', '8'].includes(d.SUBJECTAREA.charAt(0)) });

  let sex = null
  let nBin = 26
  let subject = null
  let homeCountries = null
  let hostCountries = null
  let minAge = null
  let maxAge = null

  var tool = d3.select("body").append("div").attr("class", "toolTip");

  $("#students").text(nf.format(data.length) + ' students')
  $("#reset").on('click', function () {
    resetFilters()
  })


  // HISTOGRAM -------------------------------------------------------------------------------------------------------------------------------------


  // set the dimensions and margins of the graph
  var marginHist = { top: 10, right: 10, bottom: 40, left: 40 },
    widthHist = 500 - marginHist.left - marginHist.right,
    heightHist = 400 - marginHist.top - marginHist.bottom;

  // append the svg object to the body of the page
  var svgHist = d3.select("#chart")
    .append("svg")
    .attr("width", widthHist + marginHist.left + marginHist.right)
    .attr("height", heightHist + marginHist.top + marginHist.bottom)
    .append("g")
    .attr("transform",
      "translate(" + marginHist.left + "," + marginHist.top + ")");


  var x = d3.scaleLinear()
    .domain([17, 50])
    .range([0, widthHist]);
  svgHist.append("g")
    .attr("transform", "translate(0," + heightHist + ")")
    .call(d3.axisBottom(x))


  svgHist.append("text").attr("transform",
    "translate(" + (433 / 2) + " ," +
    (heightHist + marginHist.top + 25) + ")")
    .style("text-anchor", "middle")
    .text("age").attr("font-size", "18px").attr('font-weight', 400)



  // Y axis: initialization anim
  var y = d3.scaleLinear()
    .range([heightHist, 0]);
  var yAxis = svgHist.append("g")


  function updateHist() {

    let histData = filterData(true, true, false, true)
    var countThreshold = 30

    var byAge = d3.nest()
      .key(function (d) {
        let age = parseInt(d.AGE)
        if (age < 35) {
          return age
        }
        return age

      })
      .rollup(function (v) { return v.length })
      .entries(histData);

    byAge = byAge.filter(function (d) { return d.value >= countThreshold });

    byAge.sort(function (a, b) {
      return a.key - b.key;
    });

    var histogram = d3.histogram()
      .value(function (d) { return d.AGE; })
      .domain(x.domain())
      .thresholds(x.ticks(nBin));

    var bins = histogram(histData);

    y.domain([0, d3.max(bins, function (d) { return d.length; })]);
    yAxis
      .transition()
      .ease(d3.easeSin)
      .duration(750)
      .call(d3.axisLeft(y));

    var u = svgHist.selectAll("rect")
      .data(bins)


    u
      .enter()
      .append("rect") // Add a new rect for each new elements
      .merge(u)
      .on("mousemove", function (d) {
        tool.style("left", d3.event.pageX + 10 + "px")
        tool.style("top", d3.event.pageY - 20 + "px")
        tool.style("display", "inline-block");
        if (d.x0 === d.x1 - 1) {
          tool.html('age: ' + d.x0 + '<br>' + nf.format(d.length) + ' students');
        } else {
          tool.html('age: ' + d.x0 + '-' + (d.x1 - 1) + '<br>' + nf.format(d.length) + ' students');
        }
      }).on("mouseout", function (d) {
        tool.style("display", "none");
      })
      .transition()
      .duration(1000)
      .attr("x", 1)
      .attr("transform", function (d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
      .attr("width", function (d) { return Math.max(x(d.x1) - x(d.x0) - 1, 0); })
      .attr("height", function (d) { return heightHist - y(d.length); })
      .style("fill", function (d) { if (minAge == d.x0) { return '#9D7660' } return "#D7B5A6" })

    svgHist.selectAll("rect").on("click", function (d) {
      if (minAge === d.x0) {
        minAge = null
        maxAge = null
      } else {
        minAge = d.x0
        maxAge = d.x1 - 1
      }

      update()
    });
    u.exit()
      .remove()

  }


  // Initialize with 52 bins
  updateHist()


  // Listen to the button -> update if user change it
  d3.selectAll("input").on("change", function () {
    nBin = this.value
    if (!minAge && !maxAge) {
      update(true, false)
    } else {
      minAge = null
      maxAge = null
      update()
    }

  });



  // DONUT ------------------------------------------------------------------------------------------------------------------------------


  // set the dimensions and margins of the graph
  var widthDon = 500
  heightDon = 450
  marginDon = 50
  var radiusDon = Math.min(widthDon, heightDon) / 2 - marginDon

  var donFields = []
  donFields['M'] = 'male'
  donFields['F'] = 'female'

  var defaultColorM = '#A0CBE8',
    defaultColorF = '#FF9D9A',
    lightColorF = '#ffe1e0',
    lightColorM = '#d9eaf5'


  // append the svg object to the div called 'my_dataviz'
  var svgDon = d3.select("#donut")
    .append("svg")
    .attr("width", widthDon)
    .attr("height", heightDon)
    .append("g")
    .attr("id", "pieChart")

    .attr("transform", "translate(" + widthDon / 2 + "," + heightDon / 2 + ")");

  svgDon.append("text").attr("transform",
    "translate(" + (0) + " ," +
    (3) + ")")
    .style("text-anchor", "middle")
    .text("sex").attr("font-size", "18px").attr('font-weight', 400)

  var bySex = d3.nest()
    .key(function (d) {
      return d.SEX

    })
    .rollup(function (v) { return v.length })
    .entries(data);

  donData = {}

  bySex.forEach(element => {
    donData[element.key] = element.value
  });


  // Compute the position of each group on the pie:
  var pie = d3.pie()
    .value(function (d) { return d.value; })


  // The arc generator
  var arc = d3.arc()
    .innerRadius(radiusDon * 0.5)         // This is the size of the donut hole
    .outerRadius(radiusDon * 0.8)

  // Another arc that won't be drawn. Just for labels positioning
  var outerArc = d3.arc()
    .innerRadius(radiusDon * 0.9)
    .outerRadius(radiusDon * 0.9)

  var pathDon = svgDon.selectAll("path")
    .data(pie(d3.entries(donData)))
    .enter()
    .append("path")
    .on("mousemove", function (d) {
      tool.style("left", d3.event.pageX + 10 + "px")
      tool.style("top", d3.event.pageY - 20 + "px")
      tool.style("display", "inline-block");
      tool.html((d.data.value / totalDon * 100).toFixed(2) + '%' + '<br>' + nf.format(d.data.value) + ' students');
    }).on("mouseout", function (d) {
      tool.style("display", "none");
    })

  var totalDon = d3.sum(pie(d3.entries(donData)), function (d) {
    return d.data.value;
  });

  // Add the polylines between chart and labels:
  svgDon
    .selectAll('allPolylines')
    .data(pie(d3.entries(donData)))
    .enter()
    .append('polyline')
    .attr("stroke", "black")
    .style("fill", "none")
    .attr("stroke-width", 1)
    .attr('points', function (d) {
      var posA = arc.centroid(d) // line insertion in the slice
      var posB = outerArc.centroid(d) // line break: we use the other arc generator that has been built only for that
      var posC = outerArc.centroid(d); // Label position = almost the same as posB
      var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2 // we need the angle to see if the X position will be at the extreme right or extreme left
      posC[0] = radiusDon * 0.95 * (midangle < Math.PI ? 1 : -1); // multiply by 1 or -1 to put it on the right or on the left
      return [posA, posB, posC]
    })
  // Add the polylines between chart and labels:
  svgDon
    .selectAll('allLabels')
    .data(pie(d3.entries(donData)))
    .enter()
    .append('text')
    .text(function (d) { return donFields[d.data.key] })
    .attr('transform', function (d) {
      var pos = outerArc.centroid(d);
      var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
      pos[0] = radiusDon * 0.99 * (midangle < Math.PI ? 1 : -1);
      return 'translate(' + pos + ')';
    })
    .style('text-anchor', function (d) {
      var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
      return (midangle < Math.PI ? 'start' : 'end')
    })

  pathDon
    .transition()
    .duration(500)
    .attr("fill", function (d, i) {
      if (d.data.key === 'F') {
        if (sex === 'M') {
          return lightColorF
        }
        return defaultColorF
      } else {
        if (sex === 'F') {
          return lightColorM
        }
        return defaultColorM

      }
    })
    .attr("d", arc)
    .each(function (d) { this._current = d; }); // store the initial angles



  function updateDon() {

    let donData = filterData(false)
    svgDon.selectAll("polyline").remove()
    svgDon.selectAll("text").remove()




    var bySex = d3.nest()
      .key(function (d) {
        return d.SEX

      })
      .rollup(function (v) { return v.length })
      .entries(donData);

    donData = {}

    bySex.forEach(element => {
      donData[element.key] = element.value
    });

    pathDon.data(pie(d3.entries(donData)))
    pathDon.attr("fill", function (d, i) {
      if (d.data.key === 'F') {
        if (sex === 'M') {
          return lightColorF
        }
        return defaultColorF
      } else {
        if (sex === 'F') {
          return lightColorM
        }
        return defaultColorM

      }
    }).on("mousemove", function (d) {
      tool.style("left", d3.event.pageX + 10 + "px")
      tool.style("top", d3.event.pageY - 20 + "px")
      tool.style("display", "inline-block");
      tool.html((d.data.value / totalDon * 100).toFixed(2) + '%' + '<br>' + nf.format(d.data.value) + ' students');
    }).on("mouseout", function (d) {
      tool.style("display", "none");
    })
    pathDon.transition().duration(750).attrTween("d", arcTween) // redraw the arcs

    var totalDon = d3.sum(pie(d3.entries(donData)), function (d) {
      return d.data.value;
    });

    svgDon.append("text").attr("transform",
      "translate(" + (0) + " ," +
      (0) + ")")
      .style("text-anchor", "middle")
      .text("sex").attr("font-size", "20px")


    // Add the polylines between chart and labels:
    svgDon
      .selectAll('allPolylines')
      .data(pie(d3.entries(donData)))
      .enter()
      .append('polyline')
      .attr("stroke", "black")
      .style("fill", "none")
      .attr("stroke-width", 1)
      .attr('points', function (d) {
        var posA = arc.centroid(d) // line insertion in the slice
        var posB = outerArc.centroid(d) // line break: we use the other arc generator that has been built only for that
        var posC = outerArc.centroid(d); // Label position = almost the same as posB
        var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2 // we need the angle to see if the X position will be at the extreme right or extreme left
        posC[0] = radiusDon * 0.95 * (midangle < Math.PI ? 1 : -1); // multiply by 1 or -1 to put it on the right or on the left
        return [posA, posB, posC]
      })
    // Add the polylines between chart and labels:
    svgDon
      .selectAll('allLabels')
      .data(pie(d3.entries(donData)))
      .enter()
      .append('text')
      .text(function (d) { return donFields[d.data.key] })
      .attr('transform', function (d) {
        var pos = outerArc.centroid(d);
        var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
        pos[0] = radiusDon * 0.99 * (midangle < Math.PI ? 1 : -1);
        return 'translate(' + pos + ')';
      })
      .style('text-anchor', function (d) {
        var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
        return (midangle < Math.PI ? 'start' : 'end')
      })





  }



  function arcTween(a) {
    var i = d3.interpolate(this._current, a);
    this._current = i(0);
    return function (t) {
      return arc(i(t));
    };
  }
  svgDon.selectAll("path")
    .on("click", function (d) {
      if (sex === d.data.key) {
        sex = null
      } else {
        sex = d.data.key
      }
      update()
    });

  // TREEMAP ------------------------------------------------------------------------------------------------------------------------------

  // set the dimensions and margins of the graph
  var marginTree = { top: 35, right: 10, bottom: 5, left: 10 },
    widthTree = 800 - marginTree.left - marginTree.right,
    heightTree = 455 - marginTree.top - marginTree.bottom


  var svgTree = d3.select("#tree")
    .append("svg")
    .attr("width", widthTree + marginTree.left + marginTree.right)
    .attr("height", heightTree + marginTree.top + marginTree.bottom)
    .append("g")
    .attr("transform",
      "translate(" + marginTree.left + "," + marginTree.top + ")");

  const fields = []
  //fields[0] = 'General Programmes'
  fields[1] = 'Education'
  fields[2] = 'Humanities, Arts'
  fields[3] = 'Social sciences, Business, Law'
  fields[4] = 'Science, Mathematics, Computing'
  fields[5] = 'Engineering, Manufacturing, Construction'
  fields[6] = 'Agriculture, Veterinary'
  fields[7] = 'Health, Welfare'
  fields[8] = 'Services'

  colorTree = d3.scaleOrdinal(d3.schemeTableau10)

  function updateTree() {
    svgTree.selectAll("g > *").remove()


    var treeData = filterData()

    var bySubject = d3.nest()
      .key(function (d) {
        let subject = parseInt(d.SUBJECTAREA.charAt(0))

        return subject
      })
      .rollup(function (v) { return v.length })
      .entries(treeData);


    treeData = []
    treeData[0] = { name: 'Main', parent: '', value: '' }
    let i = 1
    bySubject.forEach(element => {
      if (element.key !== 'undefined') {
        treeData[i] = { name: element.key, parent: 'Main', value: element.value }

      }
      i++
    });
    var root = d3.stratify()
      .id(function (d) { if (d.name === 'Main') { return d.name }; })   // Name of the entity (column name is name in csv)
      .parentId(function (d) { return d.parent; })   // Name of the parent (column name is parent in csv)
      (treeData);
    root.sum(function (d) { return +d.value })



    d3.treemap()
      .size([widthTree, heightTree])
      .padding(4)
      .tile(d3.treemapBinary)
      (root)



    svgTree
      .selectAll("rect")
      .data(root.leaves())
      .enter()
      .append("rect")
      .attr('x', function (d) { return d.x0; })
      .attr('y', function (d) { return d.y0; })
      .attr('height', function (d) { return d.y1 - d.y0; })
      .style("fill", function (d) { return colorTree(d.data.name); })
      .on("mousemove", function (d) {
        tool.style("left", d3.event.pageX + 10 + "px")
        tool.style("top", d3.event.pageY - 20 + "px")
        tool.style("display", "inline-block");
        tool.html(fields[parseInt(d.data.name)] + "<br>" + nf.format(d.data.value) + ' students');
      }).on("mouseout", function (d) {
        tool.style("display", "none");
      })
      .transition()
      .ease(d3.easeSin)
      .duration(750)
      .attr('width', function (d) { return d.x1 - d.x0; })




    // .append('title')
    // .text(function (d) { return fields[parseInt(d.data.name)] })

    // and to add the text labels
    svgTree
      .selectAll("text")
      .data(root.leaves())
      .enter()
      .append("text")
      .append("tspan")
      //.attr("x", function (d) { return  })    // +10 to adjust position (more right)
      //  .attr("y", function (d) { return d.y0 + 20 })    // +20 to adjust position (lower)
      //  .text(function (d) { return `${ fields[parseInt(d.data.name)]}` })
      .html(function (d) {
        var x = d.x0 + 10
        var y = d.y0 + 20


        var output = ''
        var nameSplit = fields[parseInt(d.data.name)].split(', ')

        if (d.x1 - d.x0 > 50 && d.y1 - d.y0 > 30) {
          nameSplit.forEach(element => {

            output += "<tspan x=" + x + " dy=" + (y) + ">" + element + "</tspan>";
            y = 15

          })
        }
        //output += "<tspan x=" + x + " dy=" + 20 + ">" + nf.format(d.data.value) + "</tspan>";
        return output
      })
      .attr("font-size", "10px")
      .attr("font-weight", "600")

      .attr("fill", "white")

    svgTree.selectAll("rect")
      .on("click", function (d) {
        if (subject === d.data.name) {
          subject = null
        } else {
          subject = d.data.name
        }
        update()

      });

    svgTree.append("text").attr("transform",
      "translate(" + (widthTree / 2) + " ," +
      (-15) + ")")
      .style("text-anchor", "middle")
      .text("subjects").attr("font-size", "18px").attr('font-weight', 400)
    svgTree.selectAll("rect").exit().remove()

  }
  updateTree()
  // SANKEY -------------------------------------------------------------------------------------------------------------------------------------

  var marginSan = { top: 50, right: 10, bottom: 50, left: 10 },
    widthSan = 800 - marginSan.left - marginSan.right,
    heightSan = 480 - marginSan.top - marginSan.bottom


  // format variables
  var formatNumber = d3.format(",.0f"),    // zero decimal places
    format = function (d) { return formatNumber(d) + " " + 'students'; },
    colorSan = d3.scaleOrdinal(['#4E79A7', '#A0CBE8', '#F28E2B', '#FFBE7D', '#59A14F', '#8CD17D', '#B6992D',
      '#F1CE63', '#499894', '#86BCB6', '#E15759', '#FF9D9A', '#79706E', '#BAB0AC', '#D37295', '#FABFD2', '#B07AA1',
      '#D4A6C8', '#9D7660', '#D7B5A6']);


  // append the svg object to the body of the page
  var svgSan = d3.select("#sankey").append("svg")
    .attr("width", widthSan + marginSan.left + marginSan.right)
    .attr("height", heightSan + marginSan.top + marginSan.bottom)
    .append("g")
    .attr("transform",
      "translate(" + marginSan.left + "," + marginSan.top + ")");

  // Set the sankey diagram properties
  var sankey = d3.sankey()
    .nodeWidth(10)
    .nodePadding(2)
    .size([widthSan, heightSan]);

  var path = sankey.link();


  var allowedCountries = ['IT', 'DE', 'UK', 'ES', 'FR', 'AT', 'PL', 'TR', 'BE', 'NL', 'CZ', 'HU', 'SE', 'NO', 'FI', 'DK', 'LT']

  var countries = d3.map(data, function (d) { return d.COUNTRYOFHOMEINSTITUTION }).keys()

  // sort data
  countries.sort(function (b, a) {
    if (a < b) { return -1; }
    if (a > b) { return 1; }
    return 0;
  });

  var otherCountries = countries.filter(function (d) { return !allowedCountries.includes(d) })


  function getGraphData() {
    let sanData = filterData(true, true, true, false)


    var allowedCountries = ['IT', 'DE', 'UK', 'ES', 'FR', 'AT', 'PL', 'TR', 'BE', 'NL', 'CZ', 'HU', 'SE', 'NO', 'FI', 'DK', 'LT']

    var countries = d3.map(sanData, function (d) { return d.COUNTRYOFHOMEINSTITUTION }).keys()

    // sort data
    countries.sort(function (b, a) {
      if (a < b) { return -1; }
      if (a > b) { return 1; }
      return 0;
    });

    var otherCountries = countries.filter(function (d) { return !allowedCountries.includes(d) })
    countries = countries.filter(function (d) { return allowedCountries.includes(d) })


    var byHome = d3.nest()
      .key(function (d) {
        let home = d.COUNTRYOFHOMEINSTITUTION
        let host = d.COUNTRYOFHOSTINSTITUTION

        if (!allowedCountries.includes(home)) home = 'OT'
        if (!allowedCountries.includes(host)) host = 'OT'

        if (home.length === 2) {
          return home + host
        }
      })
      .rollup(function (v) { return v.length })
      .entries(sanData);



    var nodes = []

    var nodesIndex = 0
    var nodesMap = {}

    nodesMap['OT'] = { 'home': nodesIndex, 'host': nodesIndex + 1 }
    nodes[nodesIndex] = { 'node': nodesIndex, 'name': 'OT' }
    nodes[nodesIndex + 1] = { 'node': nodesIndex + 1, 'name': 'OT' }
    nodesIndex += 2


    countries.forEach(country => {
      nodesMap[country] = { 'home': nodesIndex, 'host': nodesIndex + 1 }
      nodes[nodesIndex] = { 'node': nodesIndex, 'name': country }
      nodes[nodesIndex + 1] = { 'node': nodesIndex + 1, 'name': country }

      nodesIndex += 2
    });


    // sort data
    byHome.sort(function (a, b) {
      if (a.key < b.key) { return -1; }
      if (a.key > b.key) { return 1; }
      return 0;
    });

    var links = []
    var linkIndex = 0
    function split_at_index(value, index) {
      return value.substring(0, index) + "," + value.substring(index);
    }
    byHome.forEach(element => {
      let mapping = split_at_index(element.key, 2).split(',')

      links[linkIndex] = { 'source': nodesMap[mapping[0]].home, 'target': nodesMap[mapping[1]].host, 'value': element.value }
      linkIndex++

    });
    return {
      "nodes": nodes,
      "links": links
    }
  }


  function updateSan() {
    svgSan.selectAll("g > *").remove()

    svgSan.append("text").attr("transform",
      "translate(" + (widthSan / 2) + " ," +
      (heightSan + marginSan.bottom - 5) + ")")
      .style("text-anchor", "middle")
      .text("host countries").attr("font-size", "18px").attr('font-weight', 400)

    svgSan.append("text").attr("transform",
      "translate(" + (widthSan / 2) + " ," +
      (heightSan + marginSan.top - 458) + ")")
      .style("text-anchor", "middle")
      .text("home countries").attr("font-size", "18px").attr('font-weight', 400)
    graph = getGraphData()
    sankey
      .nodes(graph.nodes)
      .links(graph.links)
      .layout(32);


    var selectedNode = null



    // add in the links
    var link = svgSan.append("g").selectAll(".link")
      .data(graph.links)
      .enter().append("path")
      .attr("class", "link")
      .attr("d", path)
      .style("stroke-width", function (d) { return Math.max(1, d.dy); })
      .style('stroke', function (d) {
        return colorSan(d.source.name)
      })
      .sort(function (a, b) { return b.dy - a.dy; })
      .on("mousemove", function (d) {
        let showTooltip = true
        if (selectedNode) {
          if (selectedNode.sourceLinks.length === 0) {
            if (d.target.name !== selectedNode.name) {
              showTooltip = false
            }
          } else {
            if (selectedNode.targetLinks.length === 0) {
              if (d.source.name !== selectedNode.name) {
                showTooltip = false
              }
            }
          }
        }
        if (showTooltip) {
          tool.style("left", d3.event.pageX + 10 + "px")
          tool.style("top", d3.event.pageY - 20 + "px")
          tool.style("display", "inline-block");
          tool.html(countryMatch[d.source.name] + " → " +
            countryMatch[d.target.name] + "<br>" + format(d.value));
        }
      }).on("mouseout", function (d) {
        let showTooltip = true
        if (selectedNode) {
          if (selectedNode.sourceLinks.length === 0) {
            if (d.target.name !== selectedNode.name) {
              showTooltip = false
            }
          } else {
            if (selectedNode.targetLinks.length === 0) {
              if (d.source.name !== selectedNode.name) {
                showTooltip = false
              }
            }
          }
        }
        if (showTooltip) {
          tool.style("display", "none");
        }
      })


    function click(d) {
      let sourceLinks = d.sourceLinks
      let targetLinks = d.targetLinks

      if (selectedNode === d) {
        d3.selectAll(".link").style('stroke', function (d) {
          return colorSan(d.source.name)
        }).style("stroke-opacity", 1).style("opacity", 1).style("stroke-opacity", 0.2)

        homeCountries = null
        hostCountries = null
        selectedNode = null

      } else {
        d3.selectAll(".link").style("stroke", "grey").style("opacity", 0.3).style("stroke-opacity", 0.2)
        selectedNode = d

        d3.selectAll(".link")
          .filter(function (d) {
            return sourceLinks.includes(d) || targetLinks.includes(d)
          }).style("opacity", 1.0)
          .style('stroke', function (d) {
            return colorSan(d.source.name)
          }).style("stroke-opacity", 1);



        let selectedCountries = [d.name]

        if (d.name === 'OT') {
          selectedCountries = otherCountries
        }

        if (d.sourceLinks.length === 0) {
          hostCountries = selectedCountries
          homeCountries = null
        } else {
          homeCountries = selectedCountries
          hostCountries = null

        }
      }

      update(false)

    }
    var node = svgSan.append("g").selectAll(".node")
      .data(graph.nodes)
      .enter().append("g")
      .attr("class", "node")
      .attr("transform", function (d) {
        return "translate(" + d.x + "," + d.y + ")";
      })
      .on("click", function (d) { click(d) })

    // simulate click on preselected node
    if (homeCountries) {
      let nodeName = homeCountries[0]
      if (homeCountries.length > 1) {
        nodeName = 'OT'
      }

      node.filter(function (d) {
        return d.name === nodeName && d.targetLinks.length === 0

      }).dispatch('click')
    } else if (hostCountries) {
      let nodeName = hostCountries[0]
      if (hostCountries.length > 1) {
        nodeName = 'OT'
      }

      node.filter(function (d) {
        return d.name === nodeName && d.sourceLinks.length === 0

      }).dispatch('click')
    }

    // add the rectangles for the nodes


    node.append("rect")
      .attr("height", sankey.nodeWidth())
      .attr("width", function (d) { return d.dy; })
      .style("fill", function (d) {
        return d.color = colorSan(d.name.replace(/ .*/, ""));
      })
      .style("stroke", function (d) {
        return d3.rgb(d.color).darker(2);
      })
      .on("mousemove", function (d) {
        tool.style("left", d3.event.pageX + 10 + "px")
        tool.style("top", d3.event.pageY - 20 + "px")
        tool.style("display", "inline-block");
        tool.html(countryMatch[d.name] + '<br>' + format(d.value));
      }).on("mouseout", function (d) {
        tool.style("display", "none");
      })

    node.append("text")
      .attr("text-anchor", "middle")
      .attr("x", function (d) { return d.dy / 2 })
      .attr("y", function (d) {
        if (d.targetLinks.length === 0)
          return sankey.nodeWidth() - 20;
        else
          return sankey.nodeWidth() + 15;

      })
      .attr("dy", ".35em")
      .text(function (d) {
        return d.name
      }).style("font-size", "10px")
      .filter(function (d) { return d.x < widthSan / 2; });


  };
  updateSan()

  function update(updateCountries = true, updateTreeMap = true) {
    //console.log('minAge: ' + minAge + ' maxAge: ' + maxAge + ' sex: ' + sex + ' subject: ' + subject + ' home: ' + homeCountries + ' host: ' + hostCountries)
    updateHist()
    if (updateTreeMap) updateTree()
    updateDon()
    if (updateCountries) updateSan()
    updateText()
  }
  function resetFilters() {
    minAge = null
    maxAge = null
    sex = null
    subject = null
    homeCountries = null
    hostCountries = null
    update()
  }
  function filterData(filterSex = true, filterSubject = true, filterAge = true, filterCountry = true,) {
    let filteredData = data

    if (filterAge && minAge) {
      filteredData = filteredData.filter(function (d) { return d.AGE >= minAge })
    }
    if (filterAge && maxAge) {
      filteredData = filteredData.filter(function (d) { return d.AGE <= maxAge })
    }

    if (filterSex && sex) {
      filteredData = filteredData.filter(function (d) { return d.SEX === sex })
    }
    if (filterSubject && subject) {
      filteredData = filteredData.filter(function (d) { return d.SUBJECTAREA.charAt(0) === subject })
    }
    if (filterCountry && homeCountries) {
      filteredData = filteredData.filter(function (d) { return homeCountries.includes(d.COUNTRYOFHOMEINSTITUTION) })
    }
    if (filterCountry && hostCountries) {
      filteredData = filteredData.filter(function (d) { return hostCountries.includes(d.COUNTRYOFHOSTINSTITUTION) })
    }

    return filteredData

  }
  function updateText() {
    $("#students").text(nf.format(filterData().length) + ' students')
    if (sex) {
      $("#sex").text(donFields[sex])
    } else {
      $("#sex").text('')
    }
    if (minAge && maxAge && (minAge !== maxAge)) {
      $("#age").text(minAge + '-' + maxAge + ' years')
    } else if (minAge) {
      $("#age").text(minAge + ' years')
    } else {
      $("#age").text('')
    }
    if (subject) {
      $("#subject").html(fields[parseInt(subject)])
    } else {
      $("#subject").text('')
    }
    if (homeCountries) {
      let c = countryMatch[homeCountries[0]]
      if (homeCountries.length !== 1) c = countryMatch['OT']
      $("#country").html(c + ' ->')
    } else if (hostCountries) {
      let c = countryMatch[hostCountries[0]]
      if (hostCountries.length !== 1) c = countryMatch['OT']
      $("#country").html('-> ' + c)
    } else {
      $("#country").text('')
    }

  }
});



