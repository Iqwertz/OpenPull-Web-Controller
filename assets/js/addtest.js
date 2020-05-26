///////////////////////////////////////This Handles everything when the "New Test" Button is clicked ///////////////////


//////////GLobal Vars///////////
var AddingTest = false;   //Determin if a test is currently added
var BleAddTestSendArray = [];   //Array contaiing the Data to be send over ble. Every String is a new Line in the File Created on the maschines Sd card
//var LastAddedData = ""; 
var BleSendDataIndex = 0;   //Index of the currently sended String in the BleAddTestSendArray
//var BleSendDelay = 0;
var BleSendTestMode;    //Containing the Test Mode of the currently added Test (Needs to be seperat global because it is used to start the Test at the end of data sending)

/////////Angularjs Controller////////////////
app.controller('AddTest', function($scope) {   //Start new addTest Controller
    $scope.Name="";   //Var Holding the Name of the Controller

    $scope.InfillTypeOptions = Config.StandardTestParameter.InfillType.Options;   //var Containig the InfillType options // Is set to the Default defined in the Config.js file
    $scope.InfillType = Config.StandardTestParameter.InfillType.Default;   //var Containig the Selected InfillType // Is set to the Default defined in the Config.js file

    $scope.MaterialTypeOptions = Config.StandardTestParameter.MaterialType.Options;    //var Containig the MaterialType options // Is set to the Default defined in the Config.js file
    $scope.MaterialType = Config.StandardTestParameter.MaterialType.Default; //var Containig SELECTED MaterialType options // Is set to the Default defined in the Config.js file

    $scope.OrientationOptions = Config.StandardTestParameter.Orientation.Options;   //var Containig the Orientation options // Is set to the Default defined in the Config.js file
    $scope.Orientation = Config.StandardTestParameter.Orientation.Default; //var Containig the selected Orientation // Is set to the Default defined in the Config.js file

    $scope.parameter = Config.StandardTestParameter.Parameter;    //var Containig all the non selectable Parameter // Is set to the Default defined in the Config.js file

    $scope.TestModes = Config.StandardTestParameter.TestModes.Options;   //var Containig the TestMode options // Is set to the Default defined in the Config.js file
    $scope.SelectedMode;   //Selected TestMode //No default


    $scope.Notes="";   //Var containing the Notes

    $scope.NewParameterField="";   //Var containing the Text of the NewParameter Field

    $scope.AddParameter = function() {   //Called when the + button is pressed // Adds a new Parameter to the List
        if($scope.NewParameterField!=""){   //Checks if ParameterField is filled
            $scope.parameter.push({Name: $scope.NewParameterField, Value: 0, Unit: ""});   //Pushes New Parameter to the Paremeter list
            $scope.NewParameterField="";   //Eptys Parameter field
        }
    }

    $scope.RemoveParameter = function(index) {	//Removes Parameter from the Parameter List // index = the position of the Parameter in the parameter array
        $scope.parameter.splice(index, 1);  //remove parameter at index position with splice function
    }

    $scope.StartTest = function(){    //Called when "Start Test Button is pressed

        if($scope.Name!="" && $scope.SelectedMode!=null){ //Check if the Important information is given
            var Mode; //Selected Test Mode

            //CHeck which TestMode is selected and set the correct Maschine Command
            if($scope.SelectedMode==$scope.TestModes[0]){
                Mode="M10";
            } else if ($scope.SelectedMode==$scope.TestModes[1]){
                Mode="M13";
            }

            $scope.Sending=true;  //Activat Sending

            //Add the selectable obtions to the parameter array
            $scope.parameter.unshift({Name: "Infill Type", Value: $scope.InfillType , Unit: ""});
            $scope.parameter.unshift({Name: "Material", Value: $scope.MaterialType, Unit: ""});
            $scope.parameter.unshift({Name: "Orientation", Value: $scope.Orientation, Unit: ""});

            $scope.$parent.MoveEnable=false;
            BleStartNewTest($scope.Name, $scope.parameter, Mode, $scope.Notes); //Start new Test with the entered test data
        }else{
            alert("Please Select Test Mode and set Name"); //Inform user that there is missing information
        }
    }

    $scope.ExitStartTest =function(){     //Called when the data sending is finished   //Resets the vars and moves to the main screen 
        BleSendDataIndex = 0;
        $scope.Sending=false;
        $scope.$parent.ControllerInterface=true;
    }

    $scope.SetDefault = function(){   //Resets the Data to the Defaut defined in the config.js file
        $scope.Name="";

        $scope.InfillTypeOptions = Config.StandardTestParameter.InfillType.Options;
        $scope.InfillType = Config.StandardTestParameter.InfillType.Default;

        $scope.MaterialTypeOptions = Config.StandardTestParameter.MaterialType.Options;
        $scope.MaterialType = Config.StandardTestParameter.MaterialType.Default;

        $scope.OrientationOptions = Config.StandardTestParameter.Orientation.Options;
        $scope.Orientation = Config.StandardTestParameter.Orientation.Default;

        $scope.parameter = Config.StandardTestParameter.Parameter;

        $scope.TestModes = Config.StandardTestParameter.TestModes.Options;
        $scope.SelectedMode = "";


        $scope.Notes="";

        $scope.NewParameterField="";
    }

    $scope.SendingStatus=0;
    $scope.Sending=false;
});

//Starts a new test by sending the metadata structured as json over ble
//The function is only called when a new Test is started
function BleStartNewTest(Name, Parameter, TestMode, Notes){ 
    BleAddTestSendArray=[];
    BleAddTestSendArray.push("{");
    BleAddTestSendArray.push('"MetaData": {');
    BleAddTestSendArray.push('"Name": "' + Name + '",');
    BleAddTestSendArray.push('"Date": "' + GetDateTime() + '",');
    BleAddTestSendArray.push('"Parameter": {');
    for(var x=0; x<Parameter.length; x++){  //Unwrap Parameter array and add each Parameter as a new line to the BleAddTestSendArray
        if(x!=Parameter.length-1){
            BleAddTestSendArray.push('"' + Parameter[x].Name + '" : "' + Parameter[x].Value + " " + Parameter[x].Unit + '",');
        }else{
            BleAddTestSendArray.push('"' + Parameter[x].Name + '" : "' + Parameter[x].Value + " " + Parameter[x].Unit + '"'); 
        }
    }
    BleAddTestSendArray.push('},');
    BleAddTestSendArray.push('"TestMode": "' + TestMode + '",');
    BleAddTestSendArray.push('"Notes": "' + Notes + '"');
    BleAddTestSendArray.push('},');
    // BleAddTestSendArray.push('}');

    BleSendTestMode = TestMode;  //Set Send Test Mode
    AddingTest=true;            //Start Sending (This variable is used in the Ble receive data function to let it know that the received data should be processed diffrent)
    ScrollTop();         //Scroll to Top to see progress data
    BleSendTestData();  //Start a new Test by calliing BleSendTestData with no parameter
}

//This function manages the Sending of the Data over Ble
//The Send Protocoll is:
//The PC sends "NEW" to make a new File on the maschine and set it into testdata recieve mode
//The Maschine sends "OK NEW" to confirm that a new test is started
//The PC sends the string of the first index in the BleAddTestSendArray
//The Maschine receives the data and sends it back
//The Pc check if the sent data was correct. If it was it sends "OK" and the next line. In not it sends "FALSE" and it resends the same data with a delay of 300milliseconds to avoid "gatt opertion in progress" error
//If the Maschine receives "OK" it writes the last data to the current file and it sends the new received data back, if "FALSE" or anything else it delets the received data
//This sending loop repeats until every string in the BleAddTestSendArray is sent
//When everything in the BleAddTestSendArray is sent the Pc sents "OKEND " with the Test Mode
//WHen the Maschine receives "OKEND" it closes the opened file and starts the test with the received test mode

//I implemented this send protocol to make sure the sent data is 100% correct (When developing I often had faulty data which destroyed everything)

function BleSendTestData(respons){
    if(respons){
        if(respons=="OK NEW"){
            send(BleAddTestSendArray[BleSendDataIndex]);
        }else{
            if(respons==BleAddTestSendArray[BleSendDataIndex]){
                BleSendDataIndex++;
                if(BleSendDataIndex==BleAddTestSendArray.length){
                    send("OKEND "+BleSendTestMode);
                    //setTimeout(function () {send("END "+BleSendTestMode)},BleSendDelay);
                    AddingTest=false;
                    var scope = angular.element(document.getElementById("NewTest")).scope(); //Accsess Angular Controler
                    scope.ExitStartTest();   //Exit the Start Test Screen
                }else{
                    send("OK"+BleAddTestSendArray[BleSendDataIndex]);
                    //setTimeout(function () {send(BleAddTestSendArray[BleSendDataIndex])},BleSendDelay);
                }
            }else{
                send("FALSE");
                setTimeout(function () {send("OK"+BleAddTestSendArray[BleSendDataIndex])},300);
            }
        }
    }else{
        send("NEW");
    }
    SetSendStat((BleSendDataIndex*100)/ BleAddTestSendArray.length);  //Calculate the current Sending Status in % and display it
}

function GetDateTime() {   //Function that get the Current date
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

function SetSendStat(Percent){  //Set the Send Status to the angular controller var
    var scope = angular.element(document.getElementById("NewTest")).scope();
    scope.$apply(function(){
        scope.SendingStatus = Math.round(Percent);
    })
}

function ScrollTop() {
  document.getElementById("ControlsId").scrollTop = 0;
}