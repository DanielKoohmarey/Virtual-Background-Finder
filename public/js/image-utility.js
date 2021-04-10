//https://davidwalsh.name/javascript-download
function downloadBlob(blob, fileName) {
    const a = document.createElement("a");
    a.style.display = "none";
    document.body.appendChild(a);
    a.href = window.URL.createObjectURL(blob);
    a.setAttribute("download", fileName);
    a.click();
    window.URL.revokeObjectURL(a.href);
    document.body.removeChild(a);
}

// Utility "namespace" for managing operations releated to images
var ImageUtility = {

    updateSelectedImage : function(image)
    {
        $(".gallery-images ul li img").css("animation", "none");
        $("#download-btn").css("animation", "glow-small 1s infinite alternate");

        $('#image-info').show();

        $('#author > a').attr("href", image.data('author-link') + "?utm_source=virtual_background_finder&utm_medium=referral");
        $('#author-name').text(image.data('author'));

        $("#background-img").attr("src", image.data('background-link'));

        // store the link in the download button for lookup when download is clicked
        $("#download-btn").data("download", image.data('download-link'));
        $("#download-btn").data("backup", image.data('background-link'));
        $('.selected-image').removeClass('selected-image');
        image.addClass('selected-image');
    },

    updateImages : function(images)
    {
        if(images.length > 0)
        {
            // remove all previous pages
            $( ".page" ).empty();
            $( ".page" ).hide();
            $(".page-button" ).hide();
            $('.selected-page').removeClass('selected-page');

            $('#open-modal').css('visibility','hidden');

            // sort the images by likes
            images.sort((a, b) => (a.likes < b.likes) ? 1 : -1);

            const imagesPerPage = 8;
            var pageContainers = $('.page');
            for(var i = 0; i < images.length; i++)
            {
                if(images[i].sponsorship != null)
                {
                    continue; // skip showing any ads
                }

                var thumbnailContainer=$('<li class="thumbnail-container">')

                var img = $('<img></img>');
                img.attr('src', images[i].urls.thumb);

                img.data('author',images[i].user.name);
                img.data('author-link', images[i].user.links.html);
                img.data('download-link', images[i].links.download_location);
                img.data('background-link', images[i].urls.regular)

                var divPreview=$('<div> <span> Preview </span> </div>');

                // append it the the page (limit imagesPerpage)
                var page = Math.floor(i / imagesPerPage);
                thumbnailContainer.appendTo(pageContainers[page]);
                img.appendTo(thumbnailContainer);
                divPreview.appendTo(thumbnailContainer);

                // register callback on click, we pass in the preceding img tag
                var util = this;
                divPreview.click(function(){util.updateSelectedImage($(this).prev())});
                // shelve mobile support
                //divPreview.bind('touchstart mousedown', function(e){util.updateSelectedImage($(this).prev())});

                // show new page buttons
                if(i % imagesPerPage == 0)
                {
                    $($(".page-button" )[page + 1]).show(); // offset 1 for previous button
                }
            }

            $($(".page:first")).show();
            $($(".page-button" )[1]).addClass('selected-page'); // offset 1 for previous button
            $(".page-button" ).first().show();
            $(".page-button" ).last().show();
        }
        else
        {
            $('.modal-window > div > div').text("Unable to find any images matching your search,"
                + " please try again with a new search term.");
            $('.modal-window').css('visibility','visible');
        }
    },

    search : function(searchTerm)
    {
        var data = {};
        data['search-term'] = searchTerm;
        var json = JSON.stringify(data);

        fetch('/unsplash/image', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: json
        })
            .then(response => response.json())
                .then(result => {
                    if(!result['api-valid'])
                    {
                        throw "rate limited";
                    }
                    ImageUtility.updateImages(result['images']);
                    $('.load-gallery').css('visibility','hidden');
                    $(".gallery-images ul li img").css("animation", "glow-small 1s infinite alternate");
                })
                .catch(error => {
                    $('.modal-window > div > div').text("Our app is too popular at the moment, please try again later 😢.");
                    $('.modal-window').css('visibility','visible');
                    $('.load-gallery').css('visibility','hidden');
                });
    },

    requestDownload : function(image, backup)
    {
        // https://help.unsplash.com/en/articles/2511258-guideline-triggering-a-download
        // first trigger authenticated download endpoint, then use resulting url to download
        var data = {};
        data['image'] = image;
        var json = JSON.stringify(data);

        fetch('/unsplash/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: json
        })
            .then(response => response.json())
                .then(result => {
                    ImageUtility.downloadImage(result.url);
                })
                .catch(error => {
                    $('.modal-window > div > div')[0].innerHTML ="Unable to to download image automatically 😢,"
                    + " please <a href='"+backup+"' target='_blank'>download here.</a>";
                    $('.modal-window').css('visibility','visible');
                });
    },

    downloadImage : function(image)
    {
        fetch(image)
            .then( res => res.blob() )
                .then( blob => {
                    var filePrefix = $('#search-input').data('history');
                    filePrefix = filePrefix.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                    var filePostfix = $('#author-name').text();
                    filePostfix = filePostfix.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                    downloadBlob(blob, filePrefix + '_background_' + filePostfix + '.jpg');

                    // display modal & confetti on successful download
                    confetti({ particleCount: 250,
                        spread: 160,
                        origin: { x: 0 },
                        angle: 60,
                        startVelocity: 90,
                        gravity: .8,
                        zIndex: 99999999});
                    confetti({ particleCount: 250,
                        spread: 160,
                        origin: { x: 1 },
                        angle: 120,
                        startVelocity: 90,
                        gravity: .8,
                        zIndex: 99999999});
                    setTimeout(function(){
                        var socialHTML = $('.social-icons')[0].innerHTML;
                        socialHTML = socialHTML.replace($('.social-icons')[0].textContent.trim(), '');
                        socialHTML = socialHTML.replace('fb-icon.jpg', 'fb-share.png');
                        socialHTML =socialHTML.replace('twitter-icon.jpg', 'twitter-share.png');
                        $('.modal-window > div > div')[0].innerHTML ="Awesome background 🥳!"
                        + "<br/>Please share this site if you found it useful 🙏:<br/>" + socialHTML;
                        $('.modal-window').css('visibility','visible');
                    }, 2000);
                }).catch(error => {
                    $('.modal-window > div > div')[0].innerHTML ="Unable to to download image automatically 😢,"
                    + " please <a href='"+image+"' target='_blank'>download here.</a>";
                    $('.modal-window').css('visibility','visible');
                });
    }
}