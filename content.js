function getParameterByName(name, url) {
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}
var categoriesUrl = chrome.extension.getURL("templates/categories.html");
var utopianpostUrl = chrome.extension.getURL("templates/utopian-post.html");
var tagsUrl = chrome.extension.getURL("templates/tags.html");
var voteUrl = chrome.extension.getURL("templates/vote.html");
var utopianicontUrl = chrome.extension.getURL("templates/utopian-icon.png");
var utopianVoteIconUrl = chrome.extension.getURL("templates/utopian-vote.png");

$( document ).ready(function() {
    const url = window.location.href;
    const utopian_token = $.cookie("utopian_token") || getParameterByName("access_token", url);

    if (utopian_token) {
        // new issue
        if (url.indexOf('issues/new') > -1) {
            var tagsCont = $('<div class="utopian-tags-cont"></div>').appendTo('.write-selected');
            var catsCont = $('<div class="utopian-categories-cont"></div>').appendTo('.write-selected');
            var postCont = $('<div class="utopian-post-cont"></div>').prependTo('.form-actions');

            postCont.load(utopianpostUrl, function(result) {
                $(this).find('.utopian-icon').attr('src', utopianicontUrl);
            });

            tagsCont
                .load(tagsUrl);

            catsCont
                .load(categoriesUrl);

        }
        // issues list
        if (url.indexOf('issues') > -1 && url.indexOf('issues/new') < 0) {
            $(".js-issue-row").each(function(el, index) {
                var issue = $(this);
                var id = issue.attr('data-id');
                var voteCont = $('<div class="utopian-vote-cont"></div>').appendTo(issue);

                voteCont.load(voteUrl, function(result) {
                    $(this).find('.utopian-vote-img').attr('src', utopianicontUrl);
                    $(this).find('.rewards').html('$' + Math.floor(Math.random() * 90 + 10));
                    $(this).find('.votes').html(Math.floor(Math.random() * 90 + 10));
                });

                $.get("http://localhost:4040/api/issue?id=" + id, function(data, status){
                    console.log(data);
                });
            });
        }
    }

});