/*global $:false */

$(document).ready(function(){ 

    // Init code mirror
        $('.json-textarea').each(function() {
            $(this).attr('autocapitalize', 'off')
                    .attr('autocorrect', 'off')
                    .attr('required', true);

            var editor = CodeMirror.fromTextArea(this, {
                lineNumbers: false,
                matchBrackets: true,
                extraKeys: {"Enter": "newlineAndIndentContinueComment"},
                mode: {name: "javascript", json: true},
                theme: 'default'
            });
            editor.setSize('100%', '120px');
            $(this).parent().siblings('label').click(function() {
                editor.focus();
            });
        });


        // Init select2
        $("#users").select2({
                    tokenSeparators: [",", " "],
                    placeholder: "(Optional, defaults to everyone)"
                });

        // Init user list
        toastr.info('Loading users...')
        $.get('/users', function(data) {
            var users = data.users,
                usersSelect = $('#users');

            users.forEach(function(user) {
               usersSelect.append(new Option(user));
            });
            toastr.success('Users loaded !');
        });

        // Bind form submit
        $('#pushForm').submit(function (event) {
            sendPush(formValues('#pushForm'));
            return false;
        });

        function formValues(selector) {
            return $(selector)
                    .serializeArray()
                    .reduce(function (prev, curr) {
                        var curVal = curr.value.trim();

                        if (prev[curr.name] === undefined) {
                            prev[curr.name] = curVal;
                        } else {
                            if (typeof prev[curr.name] !== "object")
                                prev[curr.name] = [curVal];

                            prev[curr.name].push(curVal);
                        }

                        return prev;
                    }, {});
        }

        function isJSON(value) {
            return typeof value === "string" && value.trim().indexOf("{") === 0;
        }

        function sendPush(formValues) {
            var pushNotification = {};

            if(formValues.users)
                pushNotification.users = [].concat(formValues.users);

            if(isJSON(formValues.androidOptions))
                pushNotification.android= JSON.parse(formValues.androidOptions);

            if(isJSON(formValues.iosOptions))
                pushNotification.ios= JSON.parse(formValues.iosOptions);

            $.ajax({
                url: '/send',
                type: 'POST',
                data: JSON.stringify(pushNotification),
                contentType: 'application/json',
                dataType: 'json',
                success: function(msg) {
                    toastr.success('Push message successfully sent!');
                },
                error: function(err) {
                    toastr.error('Failed to send push message');
                    console.dir(arguments);
                }
            });
        }

    });