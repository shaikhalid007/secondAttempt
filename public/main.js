const video = document.querySelector('video');
var messageBox = document.getElementById('message-box');
const IMAGE_SIZE = 224;
var Peer = require('simple-peer');
var socket = io();
var client = {};
var gstream = null

const TOPK = 10;

const predictionThreshold = 0.80

var words = ['hello', 'send', 'other']
var name = null
var knn;
var featureExtractor;
var model;
var isSkin = require('skintone');
var poses = [];
var poseNet;
var options={imageScaleFactor: 1.0,
		outputStride: 16,
		flipHorizontal: false,
		minConfidence: 0.2,
		maxPoseDetections: 3,
		scoreThreshold: 0.5,
		nmsRadius: 20,
		detectionType: 'single',
		multiplier: 1.0,
	}



var blueSlider = document.getElementById("blueRange");
var blueValue = document.getElementById("blueValue");
blueValue.innerHTML = blueSlider.value;
var greenSlider = document.getElementById("greenRange");
var greenValue = document.getElementById("greenValue");
greenValue.innerHTML = greenSlider.value;
var redSlider = document.getElementById("redRange");
var redValue = document.getElementById("redValue");
redValue.innerHTML = redSlider.value;


blueSlider.oninput = function() {
  blueValue.innerHTML = blueSlider.value;
}
greenSlider.oninput = function() {
  greenValue.innerHTML = greenSlider.value;
}
redSlider.oninput = function() {
  redValue.innerHTML = redSlider.value;
}

var lhSlider = document.getElementById("lhRange");
var lhValue = document.getElementById("lhValue");
lhValue.innerHTML = lhSlider.value;
var lsSlider = document.getElementById("lsRange");
var lsValue = document.getElementById("lsValue");
lsValue.innerHTML = lsSlider.value;
var lvSlider = document.getElementById("lvRange");
var lvValue = document.getElementById("lvValue");
lvValue.innerHTML = lvSlider.value;


lhSlider.oninput = function() {
  lhValue.innerHTML = lhSlider.value;
}
lsSlider.oninput = function() {
  lsValue.innerHTML = lsSlider.value;
}
lvSlider.oninput = function() {
  lvValue.innerHTML = lvSlider.value;
}

var hhSlider = document.getElementById("hhRange");
var hhValue = document.getElementById("hhValue");
hhValue.innerHTML = hhSlider.value;
var hsSlider = document.getElementById("hsRange");
var hsValue = document.getElementById("hsValue");
hsValue.innerHTML = hsSlider.value;
var hvSlider = document.getElementById("hvRange");
var hvValue = document.getElementById("hvValue");
hvValue.innerHTML = hvSlider.value;


hhSlider.oninput = function() {
  hhValue.innerHTML = hhSlider.value;
}
hsSlider.oninput = function() {
  hsValue.innerHTML = hsSlider.value;
}
hvSlider.oninput = function() {
  hvValue.innerHTML = hvSlider.value;
}



var canvas1 = document.getElementById('canvas1')
var context1 = canvas1.getContext('2d');
var canvas2 = document.getElementById('canvas2')
var context2 = canvas2.getContext('2d');
var canvas3 = document.getElementById('canvas3')
var context3 = canvas3.getContext('2d');



navigator.getUserMedia = navigator.getUserMedia ||
navigator.webkitGetUserMedia ||
navigator.mozGetUserMedia;

async function setupCamera() {
	

	if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
		throw new Error(
			'Browser API navigator.mediaDevices.getUserMedia not available');
	}
	video.width = 224
	video.height = 224
	const stream = await navigator.mediaDevices.getUserMedia({
		'audio': false,
		'video': true
	});
	video.srcObject = stream;
	gstream = stream;
	

	poseNet = ml5.poseNet(video, options, modelReady);
	// This sets up an event that fills the global variable "poses"
	// with an array every time new poses are detected
	poseNet.on('pose', function(results) {
		poses = results;
	});


	return new Promise((resolve) => {
		video.onloadedmetadata = () => {
		resolve(video);
		};
	});
}



function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* POSE NET */

function modelReady() {
	console.log('model ready')
	video.addEventListener('play', async function () {
      
    //console.log(model.predict(tf.browser.fromPixels(video)))
		var $this = this; //cache
		(function loop() {
			if (!$this.paused && !$this.ended) {
                context1.drawImage($this, 0, 0, IMAGE_SIZE, IMAGE_SIZE);
                context1.rect(124,0,100,100)
                context1.stroke()
                //context1.translate(IMAGE_SIZE, 0);
                //context1.scale(-1, 1);
                processImg();
				computeFrame();
				drawKeypoints();
				drawSkeleton();
				setTimeout(loop, 1000 / 30); // drawing at 30fps
			}
		})();
	});
}

function processImg()   {
    context3.clearRect(0,0,100,100)
    context3.drawImage(canvas2,124,0,100,100,0,0,100,100)
    let src = cv.imread(canvas3)
    cv.cvtColor(src,src, cv.COLOR_BGR2HSV)
    let dst = new cv.Mat();
    let low = new cv.Mat(src.rows, src.cols, src.type(), [parseFloat(lhSlider.value), parseFloat(lsSlider.value), parseFloat(lvSlider.value), 0]);
    let high = new cv.Mat(src.rows, src.cols, src.type(), [parseFloat(hhSlider.value), parseFloat(hsSlider.value), parseFloat(hvSlider.value), 255]);
    cv.inRange(src, low, high, dst);
    cv.imshow(canvas3, dst);
    src.delete(); dst.delete(); low.delete(); high.delete();
}
  
function drawKeypoints()  {
	// Loop through all the poses detected
	for (let i = 0; i < poses.length; i++) {
	  // For each pose detected, loop through all the keypoints
	  let pose = poses[i].pose;
	  for (let j = 0; j < pose.keypoints.length; j++) {
		// A keypoint is an object describing a body part (like rightArm or leftShoulder)
		let keypoint = pose.keypoints[j];
		// Only draw an ellipse is the pose probability is bigger than 0.2
		if (keypoint.score > 0.2) {
      context2.beginPath();
      context2.arc(keypoint.position.x, keypoint.position.y, 3, 0, 2 * Math.PI);
      context2.fillStyle = '#7f584d';
      context2.fill();
		}
	  }
	}
  }
  
  // A function to draw the skeletons
  function drawSkeleton() {
	// Loop through all the skeletons detected
	for (let i = 0; i < poses.length; i++) {
	  let skeleton = poses[i].skeleton;
	  // For every skeleton, loop through all body connections
	  for (let j = 0; j < skeleton.length; j++) {
		let partA = skeleton[j][0];
		let partB = skeleton[j][1];
		context2.beginPath();       // Start a new path
		context2.moveTo(partA.position.x, partA.position.y);    
		context2.lineTo(partB.position.x, partB.position.y);
		context2.strokeStyle = '#7f584d';
		context2.lineWidth = 3
		context2.stroke();       
    
	  }
	}
  }





/* SKIN TONE RECOGNITION */
function computeFrame() {
	let rrange=parseFloat(redSlider.value);
	let grange=parseFloat(greenSlider.value);
	let brange=parseFloat(blueSlider.value)
	let frame = context1.getImageData(0, 0, IMAGE_SIZE, IMAGE_SIZE);
		let l = frame.data.length / 4;
	for (let i = 0; i < l; i++) {
		let r = frame.data[i * 4 + 0];
		let g = frame.data[i * 4 + 1];
		let b = frame.data[i * 4 + 2];
		if (!isSkin(r+rrange,g+grange,b+brange)) {
		frame.data[i * 4 + 3] = 0;
		}   
	}
	
	context2.putImageData(frame, 0, 0);
	let src = cv.imread(canvas2);
	let dst = new cv.Mat();
	cv.medianBlur(src, dst, 3);
	let M = cv.Mat.ones(4, 4, cv.CV_8U);
	let anchor = new cv.Point(-1, -1);
	cv.morphologyEx(dst, dst, cv.MORPH_OPEN, M, anchor, 1,
					cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
	
	cv.imshow(canvas2,dst)
	src.delete();
	dst.delete();
	M.delete();
	return;
}








class Main  {
    constructor()   {
        this.wcs = document.getElementsByClassName("wcs");
        this.ddMode = document.getElementById("dd-mode");
        this.normalMode = document.getElementById("normal-mode")
        this.trainingListDiv = document.getElementById("training-list")
        this.predResults = document.getElementById("subs")
        this.trainingListDiv = document.getElementById("training-list")
        this.exampleListDiv = document.getElementById("example-list")
		this.addWordForm = document.getElementById("add-word")
		this.resultArea = document.getElementById("pred-result")

		this.mode = null
        this.infoTexts = [];
        this.training = -1; // -1 when no class is being trained
        this.videoPlaying = false;

        this.previousPrediction = -1
        this.currentPredictedWords = []
        this.round = 0
        


        // variables to restrict prediction rate
        this.now;
        this.then = Date.now()
        this.startTime = this.then;
        this.fps = 1 //framerate - number of prediction per second
        this.fpsInterval = 1000/(this.fps);
        this.elapsed = 0;


        // add word to training example set
        this.addWordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            let word = document.getElementById("new-word").value.trim().toLowerCase();

            if(word && !words.includes(word)){
                //console.log(word)
                words.splice(words.length-1,0,word) //insert at penultimate index in array
                this.createButtonList(false)
                this.updateExampleCount()
                //console.log(words)

                document.getElementById("new-word").value = ''

                // console.log(words)

            } else {
                alert("Duplicate word or no word entered")
            }

            return
        })

    

        this.updateExampleCount()


        this.createTrainingBtn()

        this.createButtonList(false)

    }

    welcomeScreen()    {
		
		messageBox.style.display = "none"
        this.trainingListDiv.style.display = "none"
        video.style.display = "none"
        this.ddMode.addEventListener("click", () => {
            console.log("mode: deaf-dumb")
            for (let i=0;i<this.wcs.length;i+=1){
                this.wcs[i].style.display = 'none';
            }
            let nameInput = document.getElementById("name")
            name = nameInput.value
            name = name.toUpperCase() + ": " 
            this.trainingScreen()
        })
        this.normalMode.addEventListener("click", () => {
            console.log("mode: normal")
            for (let i=0;i<this.wcs.length;i+=1){
                this.wcs[i].style.display = 'none';
            }
            /*let video = document.createElement('video')
            video.id = 'localVideo'
            video.srcObject = gstream
            video.setAttribute('class', 'embed-responsive-item')
            document.querySelector('#localDiv').appendChild(video)*/
            video.style.display = "block"

            let talk = document.getElementById("mpb-button")
            talk.innerHTML = "click to start speaking"
            talk.addEventListener("click", () => {
              console.log("started speech recognition");
              speechrecognition()
            })
            let nameInput = document.getElementById("name")
            name = nameInput.value
            name = name.toUpperCase() + ": " 
            videoCall()
        })
    }

    trainingScreen()   {
        this.trainingListDiv.style.display = "block"
        video.style.display = "block"
        video.play()
        this.videoPlaying = true
    }

    createTrainingBtn(){
      this.nominee = new Array(words.length).fill(0)
        var div = document.getElementById("action-btn")
        div.innerHTML = ""
    
        const trainButton = document.createElement('button')
        trainButton.id = "train-button"
        trainButton.innerText = "Training >>>"
        div.appendChild(trainButton);
    
    
        trainButton.addEventListener('mousedown', () => {
    
          if(words.length == 3){
            var proceed = confirm("You have not added any words.\n\nThe only query you can currently make is: 'hello'")
    
            if(!proceed) return
          }
    
          console.log("ready to train")
          this.createButtonList(true)
          this.addWordForm.innerHTML = ''
          this.loadKNN()
          this.createVideoCallButton()
        })
    }
    
    async loadKNN(){
        model = await tf.loadLayersModel('http://localhost:3000/tfjsmodel/model.json');
        knn = knnClassifier.create()
        featureExtractor = await mobilenet.load();
        console.log('loaded')
    }

    createButtonList(showBtn){
        //showBtn - true: show training btns, false:show only text
    
        // Clear List
        this.exampleListDiv.innerHTML = ""
    
        // Create training buttons and info texts
        for(let i=0;i<words.length; i++){
          this.createButton(i, showBtn)
        }
    }

    createButton(i, showBtn){
        const div = document.createElement('div');
        this.exampleListDiv.appendChild(div);
        div.style.marginBottom = '10px';
    
        // Create Word Text
        const wordText = document.createElement('span')
    
        if(i==0 && !showBtn){
          wordText.innerText = words[i].toUpperCase()
        } else if(i==words.length-1 && !showBtn){
          wordText.innerText = words[i].toUpperCase()
        } else {
          wordText.innerText = words[i].toUpperCase()+" "
          wordText.style.fontWeight = "bold"
        }
    
    
        div.appendChild(wordText);
    
        if(showBtn){
          // Create training button
          const button = document.createElement('button')
          button.innerText = "Add Example"//"Train " + words[i].toUpperCase()
          div.appendChild(button);
    
          // Listen for mouse events when clicking the button
          button.addEventListener('click', async () => {
			for(let j=0; j<50; j++) { 
				await this.sleep(100)
				this.training = i;
				// Get image data from video element
				const image = tf.browser.fromPixels(canvas2);
				//console.log(image.dataSync())
				const logits = featureExtractor.infer(image);
				//logits.print();
				// Train class if one of the buttons is held down
				
				knn.addExample(logits, this.training);

				// Add current image to classifier
				
		
		
			const exampleCount = knn.getClassExampleCount()
			//console.log(exampleCount);
		
			//if(Math.max(...exampleCount) > 0){
				if(exampleCount[i] > 0){
					this.infoTexts[i].innerText = ` ${exampleCount[i]} examples`
				}
            
          //}
          }
          });
    
          // Create clear button to emove training examples
          const btn = document.createElement('button')
          btn.innerText = "Clear"//`Clear ${words[i].toUpperCase()}`
          div.appendChild(btn);
    
          btn.addEventListener('mousedown', () => {
            console.log("clear training data for this label")
            knn.clearLabel(i)
            this.infoTexts[i].innerText = " 0 examples"
          })
    
          // Create info text
          const infoText = document.createElement('span')
          infoText.innerText = " 0 examples";
          div.appendChild(infoText);
          this.infoTexts.push(infoText);
        }
    }

    
    
   

    updateExampleCount(){
        var p = document.getElementById('count')
        p.innerText = `Training: ${words.length} words`
    }



    createVideoCallButton(){
      let div = document.getElementById("action-btn")
      div.innerHTML = ""
      const videoCallButton = document.createElement('button')
      div.appendChild(videoCallButton)
      videoCallButton.innerText = "Start VideoCalling >>>"

      const loadBtn = document.createElement('button')
      div.appendChild(loadBtn)
      loadBtn.innerText = "load model"

      loadBtn.addEventListener("click", () => {
        this.trainingListDiv.style.display = "none"
        knn.load("model1.json");
        videoCall();
        this.createPredictBtn()
      })


      videoCallButton.addEventListener("click", () => {
        this.trainingListDiv.style.display = "none"
        videoCall();
        this.createPredictBtn()
      })
    }
    
    createPredictBtn(){
      let div = document.getElementById("action-btn")
      div.innerHTML = ""
      const saveBtn = document.createElement('button')
      div.appendChild(saveBtn)
      saveBtn.innerText = "save model"

      saveBtn.addEventListener("click", () => {
        knn.save("model1.json");
      })

        var predButton = document.getElementById("mpb-button")
        predButton.innerHTML = "start predicting"
    
        predButton.addEventListener('click', () => {
            console.log("start predicting")
            const exampleCount = knn.getClassExampleCount()
            //console.log(exampleCount)
          // check if training has been done
          //if(Math.max(...exampleCount) > 0){
            // if wake word has not been trained
            if(exampleCount[0] == 0){
              alert(
                `You haven't added examples for the wake word HELLO`
                )
              return
            }
    
            // if the catchall phrase other hasnt been trained
            if(exampleCount[words.length-1] == 0){
              alert(
                `You haven't added examples for the catchall sign OTHER.\n\nCapture yourself in idle states e.g hands by your side, empty background etc.\n\nThis prevents words from being erroneously detected.`)
              return
            }
    
            let proceed = confirm("Remember to sign the wake word hello both at the beginning and end of your query.\n\ne.g Alexa, what's the weather (Alexa)")
    
            if(!proceed) return
            
            
            //this.textLine.classList.remove("intro-steps")
            //this.textLine.innerText = "Sign your query"
            this.startPredicting()
          /*} else {
            alert(
              `You haven't added any examples yet.\n\nPress and hold on the "Add Example" button next to each word while performing the sign in front of the webcam.`
              )
          }*/
        })
    }
      
    startPredicting(){
        // stop training
        //knn.load("model.json", () => {
          this.pred = requestAnimationFrame(this.predict.bind(this))
          //this.predict();
        //})
        
    }

    pausePredicting(){
        console.log("pause predicting")
        //cancelAnimationFrame(this.pred)
    }

    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
    

    async predict (){
        
        this.now = Date.now()
        
        this.elapsed = this.now - this.then
    
        if(this.elapsed > this.fpsInterval){
          this.then = this.now - (this.elapsed % this.fpsInterval);
          if(this.videoPlaying){
            const tensor = tf.browser.fromPixels(canvas3)
            const resized = tf.image.resizeBilinear(tensor, [64, 64]).toFloat()
            const batched = resized.expandDims(0)
            const result = model.predict(batched).dataSync();
            console.log(result);
            const exampleCount = knn.getClassExampleCount();
            const image = tf.browser.fromPixels(canvas2);
            const logits = featureExtractor.infer(image)
            //if(Math.max(...exampleCount) > 0){
           
              knn.predictClass(logits, 10).then((res) => {
                if(res.confidences[res.classIndex] > predictionThreshold &&
                  res.classIndex != this.previousPrediction &&
                  res.classIndex != words.length-1){
					
					if(res.classIndex == 1)	{
						socket.emit('chat', this.resultArea.innerHTML);
						this.resultArea.innerHTML = '';
					}
					else{
						this.resultArea.innerHTML = this.resultArea.innerHTML + " " + words[res.classIndex];
					}
					this.previousPrediction = res.classIndex;
                  
                }
              }).then(logits.dispose(),image.dispose())
            
            /*} else {
              image.dispose()
            }*/
          }
        }
        this.pred = requestAnimationFrame(this.predict.bind(this))
      }

}



async function videoCall()    {
	messageBox.style.display = "block"
    socket.emit('NewClient')
        //used to initialize a peer
	function InitPeer(type) {
		let peer = new Peer({ initiator: (type == 'init') ? true : false, stream: gstream, trickle: false })
		peer.on('stream', function (stream) {
			CreateVideo(stream)
		})
		peer.on('data', function (data) {
			let decodedData = new TextDecoder('utf-8').decode(data)
			let peervideo = document.querySelector('#peerVideo')
		})
		return peer
	}

	//for peer of type init
	function MakePeer() {
		client.gotAnswer = false
		let peer = InitPeer('init')
		peer.on('signal', function (data) {
			if (!client.gotAnswer) {
				socket.emit('Offer', data)
			}
		})
		client.peer = peer
	}

	//for peer of type not init
	function FrontAnswer(offer) {
		let peer = InitPeer('notInit')
		peer.on('signal', (data) => {
			socket.emit('Answer', data)
		})
		peer.signal(offer)
		client.peer = peer
	}

	function SignalAnswer(answer) {
		client.gotAnswer = true
		let peer = client.peer
		peer.signal(answer)
	}

	function CreateVideo(stream) {
		let video = document.createElement('video')
		video.id = 'peerVideo'
		video.srcObject = stream
		video.setAttribute('class', 'embed-responsive-item')
		document.querySelector('#peerDiv').appendChild(video)
		video.play()
		console.log("started session successfully")
	}

	function SessionActive() {
		document.write('Session Active. Please come back later')
	}



	function RemovePeer() {
		document.getElementById("peerVideo").remove();
		if (client.peer) {
			client.peer.destroy()
		}
	}

	socket.on('BackOffer', FrontAnswer)
	socket.on('BackAnswer', SignalAnswer)
	socket.on('SessionActive', SessionActive)
	socket.on('CreatePeer', MakePeer)
	socket.on('Disconnect', RemovePeer)
}





/*speech recognition*/
function speechrecognition(){
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.addEventListener('result', e => {
        const transcript = Array.from(e.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
        socket.emit('chat',name + transcript)
    });
    recognition.addEventListener('end', recognition.start);
    recognition.start();
}

socket.on('chat', function(data){
	data = name + data
	messageBox.innerHTML = messageBox.innerHTML + data + '&#13;&#10;'
	messageBox.scrollTop = messageBox.scrollHeight 
});



var main = null
window.addEventListener('load', () => {
    main = new Main();
    setupCamera();
    main.welcomeScreen();
})