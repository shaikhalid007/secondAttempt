const IMAGE_SIZE = 227;
var Peer = require('simple-peer');
var socket = io();
const video = document.querySelector('video');
video.width = IMAGE_SIZE;
video.height = IMAGE_SIZE;
var client = {};
var gstream = null
navigator.mediaDevices.getUserMedia({ video: true, audio: false })
.then(stream => {
    gstream = stream
});


import {KNNImageClassifier} from 'deeplearn-knn-image-classifier';
import * as dl from 'deeplearn';


// Webcam Image size. Must be 227.

// K value for KNN
const TOPK = 10;

const predictionThreshold = 0.98

var words = ['hello', 'send', 'other']




class Main  {
    constructor()   {
        this.wcs = document.getElementsByClassName("wcs");
        this.ddMode = document.getElementById("dd-mode");
        this.normalMode = document.getElementById("normal-mode")
        this.mode = null
        this.trainingListDiv = document.getElementById("training-list")



        this.infoTexts = [];
        this.training = -1; // -1 when no class is being trained
        this.videoPlaying = true;

        this.previousPrediction = -1
        this.currentPredictedWords = []


        // variables to restrict prediction rate
        this.now;
        this.then = Date.now()
        this.startTime = this.then;
        this.fps = 5; //framerate - number of prediction per second
        this.fpsInterval = 1000/(this.fps);
        this.elapsed = 0;

        this.trainingListDiv = document.getElementById("training-list")
        this.exampleListDiv = document.getElementById("example-list")

        this.knn = null
        

        // Get video element that will contain the webcam image

        this.addWordForm = document.getElementById("add-word")




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
        this.trainingListDiv.style.display = "none"
        video.style.display = "none"
        this.ddMode.addEventListener("click", () => {
            console.log("mode: deaf-dumb")
            for (var i=0;i<this.wcs.length;i+=1){
                this.wcs[i].style.display = 'none';
            }
            this.trainingScreen()
        })
        this.normalMode.addEventListener("click", () => {
            console.log("mode: normal")
            for (var i=0;i<this.wcs.length;i+=1){
                this.wcs[i].style.display = 'none';
            }
            videoCall()
        })
    }

    trainingScreen()   {
        this.trainingListDiv.style.display = "block"
        let video = document.createElement('video')
        video.id = 'TrainingVideo'
        video.srcObject = gstream
        video.width = IMAGE_SIZE;
        video.height = IMAGE_SIZE;
        video.setAttribute('class', 'embed-responsive-item')
        document.querySelector('#train-stream').appendChild(video)
        video.play()
    }

    createTrainingBtn(){
        var div = document.getElementById("action-btn")
        div.innerHTML = ""
    
        const trainButton = document.createElement('button')
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
    
          /*this.createPredictBtn()
    
          this.textLine.innerText = "Step 2: Train"
    
          let subtext = document.createElement('span')
          subtext.innerHTML = "<br/>Time to associate signs with the words"
          subtext.classList.add('subtext')
          this.textLine.appendChild(subtext)
          */
            const callButton = document.createElement('button')//start video calling
            callButton.innerText = "Video Call"
            this.trainingListDiv.appendChild(callButton)
            callButton.addEventListener('click', () => {
                this.trainingListDiv.style.display = "none"
                const trainStreamDiv = document.getElementById('train-stream')
                trainStreamDiv.style.display = "none"
                videoCall();
            })
        })
    }
    
    loadKNN(){

        this.knn = new KNNImageClassifier(words.length, TOPK);
    
        // Load knn model
        this.knn.load()
        .then(() => this.startTraining());
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
          wordText.innerText = words[i].toUpperCase()+" (wake/stop word) "
        } else if(i==words.length-1 && !showBtn){
          wordText.innerText = words[i].toUpperCase()+" (catchall sign) "
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
          button.addEventListener('mousedown', () => {
              this.training = i;
              console.log(i);
          });
          button.addEventListener('mouseup', () => this.training = -1);
    
          // Create clear button to emove training examples
          const btn = document.createElement('button')
          btn.innerText = "Clear"//`Clear ${words[i].toUpperCase()}`
          div.appendChild(btn);
    
          btn.addEventListener('mousedown', () => {
            console.log("clear training data for this label")
            this.knn.clearClass(i)
            this.infoTexts[i].innerText = " 0 examples"
          })
    
          // Create info text
          const infoText = document.createElement('span')
          infoText.innerText = " 0 examples";
          div.appendChild(infoText);
          this.infoTexts.push(infoText);
        }
    }

      startTraining(){
        if (this.timer) {
          this.stopTraining();
        }
        this.timer = requestAnimationFrame(this.train.bind(this));
    }
    
    stopTraining(){
        video.pause();
        cancelAnimationFrame(this.timer);
    }

    updateExampleCount(){
        var p = document.getElementById('count')
        p.innerText = `Training: ${words.length} words`
    }

    train(){
        if(this.videoPlaying){
          // Get image data from video element
          const image = dl.fromPixels(video);
    
          // Train class if one of the buttons is held down
          if(this.training != -1){
            // Add current image to classifier
            this.knn.addImage(image, this.training)
          }
    
          const exampleCount = this.knn.getClassExampleCount()
    
          if(Math.max(...exampleCount) > 0){
            for(let i=0;i<words.length;i++){
              if(exampleCount[i] > 0){
                this.infoTexts[i].innerText = ` ${exampleCount[i]} examples`
              }
            }
          }
        }
        this.timer = requestAnimationFrame(this.train.bind(this));
    }
    
      
}

function videoCall()    {
        video.style.display = "block"
        socket.emit('NewClient')
        video.srcObject = gstream
        video.play()


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
        socket.emit('chat', transcript)
    });
    recognition.addEventListener('end', recognition.start);
    recognition.start();

    socket.on('chat', function(data){
        console.log(data)
        output.innerHTML = data;
    });
}



var main = null
window.addEventListener('load', () => {
    main = new Main()
    main.welcomeScreen()
})