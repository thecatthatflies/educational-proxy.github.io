function createCloakedPage() {
    var url = window.location.href;
    var win = window.open();
    win.document.body.style.margin = "0";
    win.document.body.style.height = "100vh";
    var frm = win.document.createElement("iframe");
    frm.style.border = "none";
    frm.style.width = "100%";
    frm.style.height = "100%";
    frm.style.margin = "0";
    frm.referrerpolicy = "no-referrer";
    frm.allow = "fullscreen";
    frm.src = url;
    win.document.body.appendChild(frm);
    
    // redirecting the original tab
    setTimeout(function() {
        window.location.href = "https://www.google.com";
    }, 50); 
}