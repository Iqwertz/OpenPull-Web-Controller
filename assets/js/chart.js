var DefaultStepSize=1;

var ctx = document.getElementById('LiveChart');


ctx.height=innerDimensions('ChartCon').height;
ctx.width=innerDimensions('ChartCon').width;

var LiveChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['0'],
        datasets: [{
            backgroundColor: '#297446',
            borderColor: '#297947',
            borderWidth: 1,
            lineTension: 0,
            lineTension: 0,
            pointRadius: 0,
            fill: false,
        }]
    }, 
    options: {
        responsive: true,
        tooltips: {
            mode: 'index',
            intersect: false,
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
                    labelString: 'Force'
                }
            }]
        }
    }
});

var x=0;
setInterval(function(){test();}, 500);

function addData(data, steps) {
    var DataSteps = steps || DefaultStepSize;
    var LD=LiveChart.data.labels;
    LD.push((Number(LD[LD.length-1])+DataSteps).toString());
    LiveChart.data.datasets.forEach((dataset) => {
        dataset.data.push(data);
    });
    LiveChart.update();
}

function test(){
    console.log("f");
    x+=getRandomArbitrary(-10,10);
    addData(x);
}

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function innerDimensions(id){
   var node= document.getElementById(id)
  var computedStyle = getComputedStyle(node);

  let width = node.clientWidth; // width with padding
  let height = node.clientHeight; // height with padding

  height -= parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
  width -= parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);
  return { height, width };
}