// Contact forms post to FormSubmit, which emails the message to the support inbox.
var ENDPOINT = 'https://formsubmit.co/ajax/supportzentra108@gmail.com';
var FALLBACK = "That didn't send. Please email us at supportzentra108@gmail.com.";

document.querySelectorAll('form.js-form').forEach(function (form) {
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var status = form.querySelector('.form-status');
    var button = form.querySelector('button[type=submit]');
    var data = Object.fromEntries(new FormData(form));
    if (data._honey) return; // filled in by a bot
    delete data._honey;
    data._subject = 'New enquiry from the Zeri website';
    data._template = 'table';
    data._captcha = 'false';

    button.disabled = true;
    status.textContent = 'Sending...';
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data),
    })
      .then(function (response) { return response.json(); })
      .then(function (result) {
        if (String(result.success) !== 'true') throw new Error(result.message);
        form.reset();
        status.textContent = "Thanks. We've got it and we'll be in touch on WhatsApp.";
      })
      .catch(function () { status.textContent = FALLBACK; })
      .finally(function () { button.disabled = false; });
  });
});
