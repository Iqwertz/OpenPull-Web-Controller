var AddingTest = false;
var BleAddTestSendArray = [];
var LastAddedData = "";
var BleSendDataIndex = 0;
var BleSendDelay = 2000;
var BleSendTestMode;

app.controller('AddTest', function($scope) {
    $scope.Name="";

    $scope.parameter = [{Name: "Infill", Value: 15, Unit: "%"},{Name: "Layer Height", Value: 0.5, Unit: "mm"},{Name: "Nozzle Temperatur", Value: 200, Unit: "°"}];

    $scope.TestModes = ["Slow Test (M10)", "Fast Test (M13)"];
    $scope.SelectedMode;

    $scope.Notes="";

    $scope.NewParameterField="";
    $scope.AddParameter = function() {
        if($scope.NewParameterField!=""){
            $scope.parameter.push({Name: $scope.NewParameterField, Value: 0, Unit: ""});
            $scope.NewParameterField="";
        }
    }

    $scope.RemoveParameter = function(index) {	
        $scope.parameter.splice(index, 1);
    }

    $scope.StartTest = function(){
        
        if($scope.Name!="" && $scope.SelectedMode!=null){
            var Mode;
            if($scope.SelectedMode==$scope.TestModes[0]){
                Mode="M10";
            } else if ($scope.SelectedMode==$scope.TestModes[1]){
                Mode="M13";
            }
                   $scope.$parent.ControllerInterface=true;
            BleStartNewTest($scope.Name, $scope.parameter, Mode, $scope.Notes);
        }else{
            alert("Please Select Test Mode and set Name")
        }
    }
});  


function BleStartNewTest(Name, Parameter, TestMode, Notes){
    BleAddTestSendArray.push("{");
    BleAddTestSendArray.push('"MetaData": {');
    BleAddTestSendArray.push('"Name": "' + Name + '",');
    BleAddTestSendArray.push('"Date": "' + GetDateTime() + '",');
    BleAddTestSendArray.push('"Parameter": {');
    for(var x of Parameter){
        BleAddTestSendArray.push('"' + x.Name + '" : "' + x.Value + " " + x.Unit + '",');
    }
    BleAddTestSendArray.push('},');
    BleAddTestSendArray.push('"TestMode": "' + TestMode + '",');
    BleAddTestSendArray.push('"Notes": "' + Notes + '"');
    BleAddTestSendArray.push('},');
   // BleAddTestSendArray.push('}');
    
    BleSendTestMode = TestMode;
    AddingTest=true;
    BleSendTestData();
    
}

function BleSendTestData(respons){
    if(respons){
        if(respons=="OK NEW"){
            send(BleAddTestSendArray[BleSendDataIndex]);
        }else{
            if(respons==BleAddTestSendArray[BleSendDataIndex]){
                send("OK");
                BleSendDataIndex++;
                if(BleSendDataIndex==BleAddTestSendArray.length){
                    setTimeout(function () {send("END "+BleSendTestMode)},BleSendDelay);
                    AddingTest=false;
                }else{
                    console.log("Delay");
                    setTimeout(function () {send(BleAddTestSendArray[BleSendDataIndex])},BleSendDelay);
                }
            }else{
                send("FALSE");
            }
        }
    }else{
        send("NEW");
    }
}

function GetDateTime() {
    var now     = new Date(); 
    var year    = now.getFullYear();
    var month   = now.getMonth()+1; 
    var day     = now.getDate();
    var hour    = now.getHours();
    var minute  = now.getMinutes();
    var second  = now.getSeconds(); 
    if(month.toString().length == 1) {
        month = '0'+month;
    }
    if(day.toString().length == 1) {
        day = '0'+day;
    }   
    if(hour.toString().length == 1) {
        hour = '0'+hour;
    }
    if(minute.toString().length == 1) {
        minute = '0'+minute;
    }
    if(second.toString().length == 1) {
        second = '0'+second;
    }   
    var dateTime = year+'/'+month+'/'+day+' '+hour+':'+minute+':'+second;   
    return dateTime;
}
