app.controller('Popup', function($scope) {   //Start new popup COntroller
    $scope.maximum = 0;
    $scope.breakpoint = 0;
    $scope.showPopup = true;
    $scope.download = function(){
        downloadObjectAsJson(LastTestData, LastTestData.MetaData.Name);
    }
    $scope.openDataInVisualizer = function(){
        localStorage.setItem("openPullTestData", LastTestData);
        window.open("https://iqwertz.github.io/Visualizer/?localData=true")
    }
}); 

function SetPopupData(parameter, data){  //Set the Send Status to the angular controller var
    var scope = angular.element(document.getElementById("popup")).scope();
    scope.$apply(function(){
        scope[parameter] = data; 
    })
} 

function downloadObjectAsJson(exportObj, exportName){
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }