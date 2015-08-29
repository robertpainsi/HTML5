﻿
var img1, img2, img3, img4, img5, img6, img7, img8, img9;

var imgLoadCounter = 0;
var imgLoadHandler = function () {
    imgLoadCounter++;
    if (imgLoadCounter == 9) //all loaded
        runTests();
};

window.onload = function () {

    img1 = new Image();
    img1.addEventListener("load", imgLoadHandler);
    img1.src = "../../ClientTests/pocketCodeTest/_resources/images/imgHelper1.png";

    img2 = new Image();
    img2.addEventListener("load", imgLoadHandler);
    img2.src = "../../ClientTests/pocketCodeTest/_resources/images/imgHelper2.png";

    img3 = new Image();
    img3.addEventListener("load", imgLoadHandler);
    img3.src = "../../ClientTests/pocketCodeTest/_resources/images/imgHelper3.png";

    img4 = new Image();
    img4.addEventListener("load", imgLoadHandler);
    img4.src = "../../ClientTests/pocketCodeTest/_resources/images/imgHelper4.png";

    img5 = new Image();
    img5.addEventListener("load", imgLoadHandler);
    img5.src = "../../ClientTests/pocketCodeTest/_resources/images/imgHelper5.png";

    img6 = new Image();
    img6.addEventListener("load", imgLoadHandler);
    img6.src = "../../ClientTests/pocketCodeTest/_resources/images/imgHelper6.png";

    img7 = new Image();
    img7.addEventListener("load", imgLoadHandler);
    img7.src = "../../ClientTests/pocketCodeTest/_resources/images/imgHelper7.png";

    img8 = new Image();
    img8.addEventListener("load", imgLoadHandler);
    img8.src = "../../ClientTests/pocketCodeTest/_resources/images/imgHelper8.png";

    img9 = new Image();
    img9.addEventListener("load", imgLoadHandler);
    img9.src = "../../ClientTests/pocketCodeTest/_resources/images/imgHelper9.png";

};

var runTests = function () {

    var ih = PocketCode.ImageHelper;
    ih._init(); //call init myself to manipulate the canvas element before calling the methods
    document.body.style.backgroundColor = 'lightblue';
    document.body.appendChild(ih._canvas);
    //ih._canvas.style.backgroundColor = 'lightgray';

    var offsets;
    //offsets= ih.getImageTrimOffsets(img1, 1, 0, true, true, true, true);
    //offsets = ih.getImageTrimOffsets(img2, 1, 0, true, true, true, true);
    //offsets = ih.getImageTrimOffsets(img3, 1, 0, true, true, true, true);
    //offsets = ih.getImageTrimOffsets(img4, 1, 0, true, true, true, true);
    //offsets = ih.getImageTrimOffsets(img5, 1, 0, true, true, true, true);
    //offsets = ih.getImageTrimOffsets(img6, 1, 0, true, true, true, true);
    //offsets = ih.getImageTrimOffsets(img7, 1, 0, true, true, true, true);
    //offsets = ih.getImageTrimOffsets(img8, 1, 0, true, true, true, true);

    //offsets = ih.getImageTrimOffsets(img3, 10, 0, true, true, true, true);
    //offsets = ih.getImageTrimOffsets(img3, 5, 0, true, true, true, true);
    //offsets = ih.getImageTrimOffsets(img3, 0.5, 0, true, true, true, true);

    offsets = ih.getImageTrimOffsets(img9, 1, 30, /*false, false, */true, true, true, true);
    console.log(offsets);
    offsets = ih.getImageTrimOffsets(img9, 1, 30, /*true, true, */true, true, true, true);
    console.log(offsets);

    var imgObject6 = ih.adjustCenterAndTrim(img6);//, 0.5);
    document.body.appendChild(imgObject6.image);

    var imgObject7 = ih.adjustCenterAndTrim(img7);//, 0.5);
    document.body.appendChild(imgObject7.image);

    var imgObject8 = ih.adjustCenterAndTrim(img8);//, 0.5);
    document.body.appendChild(imgObject8.image);

    var imgObject9 = ih.adjustCenterAndTrim(img9, .3);
    //imgObject9 = ih.scale(imgObject9, 0.5);//, 0.5);
    document.body.appendChild(imgObject9.image);
    //alert(imgObject9.offsetX + ', ' + imgObject9.offsetY);

    var breakpoint = true;


};

