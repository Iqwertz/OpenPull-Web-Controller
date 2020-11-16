///////////////////////////////////////This Handles everything when the "New Test" Button is clicked ///////////////////


//////////GLobal Vars///////////
var LastTestData;  //object storing the test data to be able to download it later
var Testing = false;  //Determin if the maschine is testing

var AddingTest = false;   //Determin if a test is currently added
var BleAddTestSendArray = [];   //Array contaiing the Data to be send over ble. Every String is a new Line in the File Created on the maschines Sd card
//var LastAddedData = ""; 
var BleSendDataIndex = -1;   //Index of the currently sended String in the BleAddTestSendArray
//var BleSendDelay = 0;
var BleSendTestMode;    //Containing the Test Mode of the currently added Test (Needs to be seperat global because it is used to start the Test at the end of data sending)

const MaxSendingErrors = 10; //Max Amount of Sending Errors when Starting a new Test until sending get aborted.
const BleSendTimeout = 2000; //Max no respons Time until Sending is aborted

var SendingErrors=0;
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

    $scope.AutoAbort = true //Var holding the AutoAbort

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
            var addition;
            if($scope.AutoAbort){
                addition=" A1";
            }else{
                addition=" A0";
            }
            if($scope.SelectedMode==$scope.TestModes[0]){
                Mode="M10"+addition;
            } else if ($scope.SelectedMode==$scope.TestModes[1]){ 
                Mode="M13"+addition;
            }else if ($scope.SelectedMode==$scope.TestModes[2]){
                Mode="M14"+addition;
            }

            $scope.Sending=true;  //Activat Sending

            var AssembledParameter = Object.create($scope.parameter);  //Array which will also contain the selectable Parameter
            //Add the selectable obtions to the parameter array
            AssembledParameter.unshift({Name: "InfillType", Value: $scope.InfillType , Unit: ""});
            AssembledParameter.unshift({Name: "Material", Value: $scope.MaterialType, Unit: ""});
            AssembledParameter.unshift({Name: "Orientation", Value: $scope.Orientation, Unit: ""});
            $scope.$parent.MoveEnable=false;
            BleStartNewTest($scope.Name, AssembledParameter, Mode, $scope.Notes); //Start new Test with the entered test data

        }else{
            alert("Please Select Test Mode and set Name"); //Inform user that there is missing information
        }
    }

    $scope.ExitStartTest =function(){     //Called when the data sending is finished   //Resets the vars and moves to the main screen 
        BleSendDataIndex = -1;
        $scope.Sending=false;
        $scope.$parent.ControllerInterface=true;
        SendingErrors = 0;
    }

    $scope.TriggerUpload = function(){  //triggers upload gcode file field
        document.getElementById("fileUpload").click();
    }

    $scope.SetDefault = function(){   //Resets the Data to the Defaut defined in the config.js file
        $scope.Name="";

        $scope.InfillTypeOptions = Object.create(Config.StandardTestParameter.InfillType.Options);
        $scope.InfillType = Object.create(Config.StandardTestParameter.InfillType.Default);

        $scope.MaterialTypeOptions = Object.create(Config.StandardTestParameter.MaterialType.Options);
        $scope.MaterialType = Object.create(Config.StandardTestParameter.MaterialType.Default);

        $scope.OrientationOptions = Object.create(Config.StandardTestParameter.Orientation.Options);
        $scope.Orientation = Object.create(Config.StandardTestParameter.Orientation.Default);

        $scope.parameter = Object.create(Config.StandardTestParameter.Parameter);

        $scope.TestModes = Object.create(Config.StandardTestParameter.TestModes.Options);
        $scope.SelectedMode = "";


        $scope.Notes="";

        $scope.NewParameterField="";
    }

    $scope.SendingStatus=0;
    $scope.Sending=false;


    //converts text to the parameter List
    $scope.setGcodeParameter = function(text, name){ 
        
        $scope.Name=name;
       let parValue = readParameter(Config.StandardTestParameter.InfillType.GcodeName, text); 
        if(!$scope.InfillTypeOptions.includes(parValue)){
                     $scope.InfillTypeOptions.push(parValue);   
        }
        $scope.InfillType = parValue;
        
        parValue = readParameter(Config.StandardTestParameter.MaterialType.GcodeName, text);
        if(!$scope.MaterialTypeOptions.includes(parValue)){
        $scope.MaterialTypeOptions.push(parValue);
        }
        $scope.MaterialType = parValue;
        for(let i=0; i<$scope.parameter.length; i++){
            console.log(i);
            $scope.parameter[i].Value=readParameter($scope.parameter[i].GcodeName, text);
        }
    }
});

//Handles the gcode file upload and processing
document.getElementById('fileUpload').addEventListener('change', getFile)

//gets the file and reads it
function getFile(event){
    const input = event.target
    if ('files' in input && input.files.length > 0) 
{
    const name = input.files[0].name;
        readFileContent(input.files[0]).then(content => {
            scopeSetGcodeParameter(content, name);
        }).catch(error => console.log(error))
    }
    event.srcElement.value = "";
}

//uses Filereader to read files and return them as a promise
function readFileContent(file) {
    const reader = new FileReader()
    return new Promise((resolve, reject) => {
        reader.onload = event => resolve(event.target.result)
        reader.onerror = error => reject(error)
        reader.readAsText(file)
    })
} 

//reads a Parameter from gcode file
function readParameter(name, code){
    let value="";
    name = "; " + name + " = ";
    let nameLength=name.length;
    let occurence = code.indexOf(name);
    let endOccurence = code.indexOf(";", occurence+1);
    value = code.substring(occurence+nameLength, endOccurence);
    value = value.replace("%", "");
        value = value.replace(/(\r\n|\n|\r)/gm, "");
    if(!isNaN(value)){
         value = parseFloat(value);   
    }
    
    return value;
}

function scopeSetGcodeParameter(text, name){
    var scope = angular.element(document.getElementById("NewTest")).scope();
    scope.$apply(function(){
        scope.setGcodeParameter(text, name);
    })
}

//Starts a new test by sending the metadata structured as json over ble
//The function is only called when a new Test is started
function BleStartNewTest(Name, Parameter, TestMode, Notes){ 
    LastTestData = {};
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
    
    const dataStructure = '"Data":[]}'
    
    let dataAsText = BleAddTestSendArray.join("")+'"Data":[], "BreakPoint":0, "Maximum":0}';
    
    dataAsText = dataAsText.replace(/(\r\n|\n|\r)/gm, "");  //remove return charackters  (Fix gcode upload Bug)
    console.log(BleAddTestSendArray);
    
   LastTestData = JSON.parse(dataAsText);
   console.log(LastTestData);
    
    BleSendTestMode = TestMode;  //Set Send Test Mode
    AddingTest=true;            //Start Sending (This variable is used in the Ble receive data function to let it know that the received data should be processed diffrent)
    Testing = true;
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
            BleSendDataIndex=0;
            send(BleAddTestSendArray[BleSendDataIndex]);
        }else if(respons=="OK NEW NOSD"){  //When no Sd Card is sent, skip sending queue and start Test
            send("END "+BleSendTestMode);
            AddingTest=false;
            var scope = angular.element(document.getElementById("NewTest")).scope(); //Accsess Angular Controler
            scope.ExitStartTest();   //Exit the Start Test Screen
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
                SendingErrors++;
                // send("FALSE");
                if(SendingErrors>MaxSendingErrors){
                    alert("Could not start Test! Try reloading page and restarting Maschine")
                    AddingTest=false;
                    var scope = angular.element(document.getElementById("NewTest")).scope(); //Accsess Angular Controler
                    scope.ExitStartTest();
                }else{
                    if(BleSendDataIndex!=-1){
                        setTimeout(function () {send("OK"+BleAddTestSendArray[BleSendDataIndex])},300);
                    }else{
                        send("NEW");
                    }
                }
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