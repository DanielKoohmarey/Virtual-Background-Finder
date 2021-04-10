/* Derived from https://github.com/bensonruan/Selfie-Anywhere/*/
const webcamElement = document.getElementById('webcam');
const webcam = new Webcam(webcamElement, 'user');
const canvasPerson = document.getElementById("canvasPerson");
const multiplier = 0.75;
const outputStride = 16;
const segmentationThreshold = 0.75;
const contextPerson = canvasPerson.getContext("2d");
let net;
let cameraFrame;
let screenMode;

window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function( callback ){
            window.setTimeout(callback, 1000 / 60);
        };
})();

window.cancelAnimationFrame = (function(){
    return  window.cancelAnimationFrame || window.mozCancelAnimationFrame;
})();

// This callback is for the webcam switch.
// If it is successful, we should hide the radio button
$("#webcam-switch").change(function () {
    if(this.checked){
        console.log('trying to enable cam');
        $('.md-modal').addClass('md-show');
        webcam.start(true)
            .then(result =>{
               console.log("webcam started");
               $(".webcam-container").removeClass("d-none");
               $("#webcam-control").hide();
               $("#search-input")[0].select();
               $("#search-input").css("animation", "glow-small 1s infinite alternate");
               
               contextPerson.clearRect(0,0,canvasPerson.width,canvasPerson.height);
               screenMode = window.innerWidth > window.innerHeight? 'l' : 'p';
               
               cameraFrame = startDetectBody();
            })
            .catch(err => {
                console.log(err);
                // set webcam 
                $('.modal-window > div > div').text("Failed to set webcam 😢. Please ensure you are using a modern browser & grant webcam permissions.");
                $('.modal-window').css('visibility','visible');
                $("#webcam-switch").prop('checked', false);
            });
    }
    else {        
        webcam.stop();
        cancelAnimationFrame(cameraFrame);
        contextPerson.clearRect(0,0,canvasPerson.width,canvasPerson.height);
        console.log("webcam stopped");
    }        
});

$("#webcam").bind("loadedmetadata", function () {
    //screenModeChange();
    if(net != null){
        cameraFrame = detectBody();
    }
});

function startDetectBody() {
    if(net == null){
        $(".load-cam").css('visibility','visible');
        /*https://github.com/tensorflow/tfjs-models/tree/master/body-pix#config-params-in-bodypixload */
        bodyPix.load({
            architecture: 'MobileNetV1',
            outputStride: outputStride,
            multiplier: multiplier,
            quantBytes: 4
        })
        .catch(error => {
            console.log(error);
            $(".load-cam").css('visibility','hidden');
            $('.modal-window > div > div').text("Failed to initialize body pix model 😢: " + error);
            $('.modal-window').css('visibility','visible');
            $("#webcam-switch").prop('checked', false)
        })
        .then(objNet => {
            $(".load-cam").css('visibility','hidden');;
            net = objNet;
            $("#canvasPerson").show();
            cameraFrame = detectBody();
            window.webcamActive = true;
            // remove the placeholder person if the user activates the webcam
            if($("#background-img").attr("src") == "img/placeholder/default-background-no-cam.png")
            {
                $("#background-img").attr("src","img/placeholder/default-background.png");
            }
        });
    }else{
        $("#canvasPerson").removeClass("d-none");
    }
}

function detectBody(){
    net.segmentPerson(webcamElement,  {
        flipHorizontal: false,
        internalResolution: 'medium',
        segmentationThreshold: segmentationThreshold
      })
    .catch(error => {
        console.log(error);
    })
    .then(personSegmentation => {
        if(personSegmentation!=null){
            drawBody(personSegmentation);
        }
    });
    cameraFrame = requestAnimFrame(detectBody);
}

function drawBody(personSegmentation)
{
    var canvas = document.createElement('canvas');
    canvas.width = webcamElement.width;
    canvas.height = webcamElement.height;
    var context = canvas.getContext('2d');
    context.drawImage(webcamElement, 0, 0, webcamElement.width, webcamElement.height);
    var imageData = context.getImageData(0,0, webcamElement.width, webcamElement.height);
    
    var pixel = imageData.data;
    for (var p = 0; p<pixel.length; p+=4)
    {
        if (personSegmentation.data[p/4] == 0) {
            pixel[p+3] = 0;
        }
    }
    context.imageSmoothingEnabled = true;
    context.putImageData(imageData,0,0);

    var imageObject=new Image();
    imageObject.onload=function(){        
        contextPerson.clearRect(0,0,canvasPerson.width,canvasPerson.height);
        contextPerson.imageSmoothingEnabled = true;
        contextPerson.drawImage(imageObject, 0, 0, canvasPerson.width, canvasPerson.height);
    }
    imageObject.src=canvas.toDataURL();
}