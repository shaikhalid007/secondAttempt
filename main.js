var video = document.querySelector('video')
var canvas = document.querySelector('canvas')
var context = canvas.getContext('2d');
var canvas2 = document.getElementById('canvas2')
var context2 = canvas2.getContext('2d');
var model;
const modelParams = {
    flipHorizontal: true,   // flip e.g for video 
    imageScaleFactor: 1.0,  // reduce input image size for gains in speed.
    maxNumBoxes: 20,        // maximum number of boxes to detect
    iouThreshold: 0.5,      // ioU threshold for non-max suppression
    scoreThreshold: 0.79,    // confidence threshold for predictions.
  }



navigator.getUserMedia = navigator.getUserMedia ||
                         navigator.webkitGetUserMedia ||
                         navigator.mozGetUserMedia;
                    


handTrack.startVideo(video).then( status => {
        if(status)  {
            navigator.getUserMedia({ audio: false, video: true },
                function(stream) {
                    video.srcObject = stream;
                    video.width = 224;
                    video.height = 224
                    video.onloadedmetadata = function(e) {
                        video.play();
                    };
                    context2.clearRect(0, 0, 224, 224)
                    setInterval(runDectection, 1000)
                },
                function(err) {
                    console.log("The following error occurred: " + err.name);
                }
            );
        }
    }
)

handTrack.load(modelParams).then(lmodel => {
    console.log("loading model")
    model = lmodel;
})

function runDectection()    {
    model.detect(video).then(predictions => {
        console.log(predictions)
        model.renderPredictions(predictions, canvas, context, video)
        
        if(predictions.length >0)   {
            for(let i=0; i< predictions.length; i++)    { 
                arr = predictions[i].bbox;
                context2.drawImage(canvas, arr[0], arr[1], arr[2], arr[3],arr[0], arr[1], arr[2], arr[3]);
            }
        }
    })
}

