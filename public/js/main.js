window.onload = (event) => {

    // add callback for search button
    $( "#search-button" ).click(function() {

        $("#search-button").css("animation", "none");

        /*if(window.webcamActive == undefined)
        {
            $('.modal-window > div > div').text("Please enable the live preview before searching!");
            $('.modal-window').css('visibility','visible');
        }*/

        var searchTerm = $('#search-input').val();
        if(searchTerm == "")
        {
            return;
        }

        // store the search for use in download filename
        $('#search-input').data('history', searchTerm);

        $('.load-gallery').css('visibility','visible');

        ImageUtility.search(searchTerm);
    });

    // support triggering search when 'enter' key pressed
    $(document).on("keypress", "input", function(e){
        if(e.which == 13){ // 13 is enter keycode
            $( "#search-button" ).click();
        }
    });

    // add callback for page buttons
    $(".page-button" ).click(function(){
        $('.page').hide();
        var currentPage = $('.selected-page').data('page-id');
        var clickedPage = $(this).data('page-id');
        if(clickedPage == "previous")
        {
            clickedPage = Math.max(1, currentPage - 1);
        }
        else if(clickedPage == "next")
        {
            var maxPage = $(".page-button:visible").length - 2; // 2 for prev/next buttons
            clickedPage = Math.min(maxPage, currentPage + 1);
        }

        $($('.page')[clickedPage - 1]).show();
        $('.selected-page').removeClass('selected-page');
        $($(".page-button")[clickedPage]).addClass('selected-page');
    });

    // add a callback for download button
    $("#download-btn").click(function(){
        $("#download-btn").css("animation", "none");
        ImageUtility.requestDownload($(this).data('download'), $(this).data('backup'));
    });

    // add callbacks to close modal window
    $(".modal-close").click(function() {
        $(".modal-window").find('img').remove();
        $(".modal-window").css('visibility','hidden');
    });
    
    window.onclick = function(event) {
      if ($(event.target).hasClass('modal-window')) {
        $(".modal-window").find('img').remove();
        $(".modal-window").css('visibility','hidden');
      }
    }
    
    // add data attributes & callback to default images to "fake" as if they came from server
    $( "li > img" ).each(function() {
        var img = $(this);
        // we've replaced our own with static versions of the server response in the index.html
        /*img.data('author', "Virtual Background Picker");
        img.data('author-link', "/");
        img.data('download-link', img.attr('src'));
        img.data('background-link', img.attr('src'));*/
        img.next().click(function(){ImageUtility.updateSelectedImage(img)});
    });

    if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
        $('.modal-window > div > div')[0].innerHTML = "This website is not intended for mobile use 😢. Please visit us on your desktop 😊!";
        $('.modal-window').css('visibility','visible');
    }

    // mobile support for click event
    $(document).on('touchstart', function(e){
        $(e.target).click();
    });

    // handle input and transition to next action suggestion (glow)
    $("#search-input").on('input', function()
    {
        $("#search-input").css("animation", "none");
        $("#search-button").css("animation", "glow-small 1s infinite alternate");
    });
};