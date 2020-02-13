(function () {
    "use strict";

    window.addEventListener('load', function () {

        api.onError(function (err) {
            console.error("[error]", err);
        });

        api.onError(function (err) {
            var error_box = document.querySelector('#error_box');
            error_box.innerHTML = err;
            error_box.style.visibility = "visible";
        });

        api.onUserUpdate(function (username) {
            if (username) window.location.href = '/';
        });

        function submit() {
            console.log(document.querySelector("form").checkValidity());
            if (document.querySelector("form").checkValidity()) {
                var username = document.querySelector("form [name=username]").value;
                var password = document.querySelector("form [name=password]").value;
                var action = document.querySelector("form [name=action]").value;
                api[action](username, password, function (err) {
                    if (err) document.querySelector('.error_box').innerHTML = err;
                });
            }
        }
        function check_pass() {
            var val = document.querySelector("form [name=password]").value;
            var no = 0;
            if (val != "") {
                // If the password length is less than or equal to 6
                if (val.length <= 8) no = 1;
                // If the password length is greater than 6 and contain any lowercase alphabet or any number 
                if (val.length > 8 && (val.match(/[a-z]/) || val.match(/\d+/))) no = 2;
                // If the password length is greater than 6 and contain alphabet and number respectively
                if (val.length > 8 && ((val.match(/[a-z]/) && val.match(/\d+/)) || (val.match(/\d+/) && val.match(/.[!,@,#,$,%,^,&,*,?,_,~,-,(,)]/)) || (val.match(/[a-z]/)))) no = 3;
                // If the password length is greater than 6 and must contain alphabets and numbers and special characters
                if (val.length > 8 && val.match(/[a-z]/) && val.match(/\d+/)) no = 4;
            }
            if (no < 3) { //not good enough
                alert("password strength not okay");
                return false;
            }
            else {
                alert("password strength okay");
                return true;
            }
        }

        document.querySelector('#signin').addEventListener('click', function (e) {
            document.querySelector("form [name=action]").value = 'signin';
            submit();
            //window.location.href = "/api/messages/";

        });

        document.querySelector('#signup').addEventListener('click', function (e) {
            document.querySelector("form [name=action]").value = 'signup';
            if (check_pass() == true) {
                //alert("true");
                submit();
            }


        });

        document.querySelector('form').addEventListener('submit', function (e) {
            e.preventDefault();
        });
    });
}());


