////////////////////////Chart////////////////

var DefaultStepSize=1;  //Step size of the chart
var DisplayedValues=200;  //Amount of datapoints displayed at ones

var ctx = document.getElementById('LiveChart');   //Livechart Context


///Set height and width to fill parent container
ctx.height=innerDimensions('ChartCon').height; 
ctx.width=innerDimensions('ChartCon').width;

//Configurate a new Chart.js CHart
var LiveChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['0'],
        datasets: [{
            data: [0],
            backgroundColor: '#297446',
            borderColor: '#297947',
            borderWidth: 3,
            lineTension: 0,
            lineTension: 0,
            pointRadius: 0,
            fill: false,
        }]
    }, 
    options: {
        responsive: true,
        tooltips: {
            mode: 'ipoint',
          //  intersect: false,
        },
        hover: {
            mode: 'nearest', 
            intersect: true
        },
        scales: {
            xAxes: [{
                display: true,
                ticks: {
                    min: 0,
                    max: 100,
                    stepSize: 0.5
                },
                scaleLabel: {
                    display: true,
                    labelString: 'Time (s)'
                }
            }],
            yAxes: [{
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Force (N)'
                }
            }]
        }
    }
});

function addData(data, steps) {  //add Data to the Chart //steps is optionsal
    var DataSteps = steps || DefaultStepSize;  //Set Datasteps
    var LD=LiveChart.data.labels;  //Get The Labels of the CHart
    LD.push((Number(LD[LD.length-1])+DataSteps).toString());   //Set the label of the char by increasing the last label by the Datasteps
    var DatasetData=LiveChart.data.datasets[0].data;   //Get the Char data
    DatasetData.push(data);  //Add the data to the Chardata array
    if(DatasetData.length>DisplayedValues){ //When the amount of data is greater than the max amount of displayed Values 
        DatasetData.shift(); //remove first data
        LD.shift();  //remove first label
    }
    LiveChart.update();  //Update Chart
}

function innerDimensions(id){   //get the dimensions of a div with padding
   var node= document.getElementById(id)
  var computedStyle = getComputedStyle(node);

  let width = node.clientWidth; // width with padding
  let height = node.clientHeight; // height with padding

  height -= parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
  width -= parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);
  return { height, width };
}
