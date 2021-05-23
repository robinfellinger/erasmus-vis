<template>
  <div id="vis" class="hidden">
    <div class="container" id="chart">
      <p>
        <label>scope: </label>
        <input id="nBin" type="radio" name="years" checked value="26">1 year
        <input id="nBin" type="radio" name="years" value="11">2 years
        <input id="nBin" type="radio" name="years" value="6">5 years
        <input id="nBin" type="radio" name="years" value="1">all
      </p>
    </div>
    <div class="container" id="tree"> </div>
    <div class="textContainer">
      <p>
      <h1>erasmus student mobility statistics 2008</h1>
      <a class="source" target="_blank"
        href="https://data.europa.eu/euodp/de/data/dataset/erasmus-mobility-statistics-2008-09">[source]</a>
      <hr>

      </p>
      <p id='students'>166,969 students</p>
      <p id='sex'></p>
      <p id='subject'></p>
      <p id='age'></p>
      <p id='country'></p>
    </div>
    <div class="container" id="donut"></div>
    <div class="container" id="sankey"> </div>
    <div class="textContainer">
      <span><a class="border" id='reset'>reset filters</a></span>
    </div>
  </div>

</template>


  <style scoped>
    body {
      font-family: 'Raleway', sans-serif;
      font-weight: 300;
      margin: auto;
      width: 98%;
      padding: 10px;

      max-width: 1920px;
      background-color: rgb(255, 255, 245);

      -webkit-touch-callout: none;
      /* iOS Safari */
      -webkit-user-select: none;
      /* Safari */
      -khtml-user-select: none;
      /* Konqueror HTML */
      -moz-user-select: none;
      /* Firefox */
      -ms-user-select: none;
      /* Internet Explorer/Edge */
      user-select: none;
      /* Non-prefixed version, currently
                                  supported by Chrome and Opera */

    }


    .node rect {
      fill-opacity: .9;
      shape-rendering: crispEdges;
      stroke-width: 0;
    }

    .node text {
      text-shadow: 0 1px 0 #fff;
    }

    .link {
      fill: none;
      stroke: #000;
      stroke-opacity: .2;
    }

    .toolTip {
      position: absolute;
      display: none;
      width: auto;
      height: auto;
      background: none repeat scroll 0 0 white;
      border: 0 none;
      border-radius: 8px 8px 8px 8px;
      box-shadow: -3px 3px 15px #888888;
      color: black;
      font: 12px sans-serif;
      padding: 5px;
      text-align: center;
    }

    .container {
      height: 480px;
      float: left;
      background-color: rgb(245, 245, 233);
      padding: 15px;
      padding-bottom: 10px;
      margin-right: 20px;
      margin-bottom: 10px;
      margin-top: 15px;
      border-radius: 8px;
    }

    .textContainer {
      height: 480px;
      font-size: 1.4em;
      position: relative;
      font-weight: 200;
      width: 20%;
      float: left;
      word-wrap: normal;
      padding: 15px;
      margin-right: 20px;
      margin-bottom: 10px;
      margin-top: 10px;
      border-radius: 8px;
    }

    .textContainer span {
      position: absolute;
      margin-bottom: 10px;
      bottom: 0;
    }

    @media screen and (max-width: 1600px) {
      body {
        width: 100%;
      }
    }

    input {
      display: inline-block;
    }

    .hidden {
      display: none;
    }

    .border {
      padding: 5px;
      border: 1px solid black;
      border-radius: 5px;
    }

    .source {
      text-decoration: none;
      font-weight: 100;
      color: rgb(34, 39, 58);

    }
  </style>
