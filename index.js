(function () {
    "use strict";

    api.onError(function (err) {
        console.error("[error]", err);
    });

    api.onError(function (err) {
        //var error_box = document.querySelector('#error_box');
        //error_box.innerHTML = err;
        alert(err);
        //error_box.style.visibility = 'visible';
    });

    api.onUserUpdate(function (username) {
        document.querySelector("#signin_button").style.visibility = (username) ? 'hidden' : 'visible';
        document.querySelector("#signout_button").style.visibility = (username) ? 'visible' : 'hidden';
        document.querySelector('#create_message_form').style.visibility = (username) ? 'visible' : 'hidden';
    });

    api.onVoteUpdate(function (message) {
        document.querySelector('#msg' + message._id + ' .upvote-icon').innerHTML = message.upvote;
        document.querySelector('#msg' + message._id + ' .downvote-icon').innerHTML = message.downvote;
    });

    api.onMessageUpdate(function (messages) {
        var message_list = ["#messages", "#messages2", "#messages3", "#messages4", "#messages5", "#messages6", "#messages7", "#messages8"];
        //message_List.forEach(element => document.querySelector(element).innerHTML = '');
        document.querySelector('#messages').innerHTML = '';
        document.querySelector('#messages2').innerHTML = '';
        document.querySelector('#messages3').innerHTML = '';
        document.querySelector('#messages4').innerHTML = '';
        document.querySelector('#messages5').innerHTML = '';
        document.querySelector('#messages6').innerHTML = '';
        document.querySelector('#messages7').innerHTML = '';
        document.querySelector('#messages8').innerHTML = '';

        var i = 0;
        messages.forEach(function (message) {

            var elmt = document.createElement('div');
            elmt.className = "message";
            elmt.id = "msg" + message._id;// <img class="message_picture" src="media/user.png" alt="${message.username}">
            elmt.innerHTML = `
            <div class="message_user">
            </div>
            <div class="message_username">${message.username}</div>
            <div class="message_content">${message.content}</div>
            <div class="upvote-icon icon">${message.upvote}</div>
            <div class="downvote-icon icon">${message.downvote}</div>
            <div class="delete-icon icon"></div>
            `;

            elmt.querySelector(".delete-icon").addEventListener('click', function () {
                api.deleteMessage(message._id);
            });
            elmt.querySelector(".upvote-icon").addEventListener('click', function () {
                api.upvoteMessage(message._id);
            });
            elmt.querySelector(".downvote-icon").addEventListener('click', function () {
                api.downvoteMessage(message._id);
            });
            //alert("end of ele create");
            document.querySelector(message_list[i]).prepend(elmt);
            i += 1;
            //alert(message_list[i]);
            // if (i > 4) {
            //     i = 0;
            // }
            //document.querySelector("#messages2").prepend(elmt);
            //document.querySelector("#messages3").prepend(elmt);
            //document.querySelector("#messages4").prepend(elmt);

        });
    });

    window.addEventListener('load', function () {
        document.querySelector('#create_message_form').addEventListener('submit', function (e) {
            e.preventDefault();
            var content = document.querySelector("#post_content").value;
            document.getElementById("create_message_form").reset();
            api.addMessage(content);
        });
    });
}());

