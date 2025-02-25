// script.js

document.getElementById("imageUpload").addEventListener("change", function(event) {
    var file = event.target.files[0];
    
    if (file) {
        var reader = new FileReader();
        
        reader.onload = function(e) {
            var image = new Image();
            image.onload = function() {
                EXIF.getData(image, function() {
                    var exifData = EXIF.getAllTags(this);
                    
                    // Menampilkan data EXIF di dalam elemen
                    var output = "<h3>EXIF Data:</h3><ul>";
                    for (var tag in exifData) {
                        if (exifData.hasOwnProperty(tag)) {
                            output += "<li>" + tag + ": " + exifData[tag] + "</li>";
                        }
                    }
                    output += "</ul>";
                    
                    var exifDataContainer = document.getElementById("exifData");
                    exifDataContainer.innerHTML = output;
                    exifDataContainer.style.display = "block";
                });
            };
            image.src = e.target.result;
        };
        
        reader.readAsDataURL(file);
    }
});
