function setComment() {
  chrome.tabs.executeScript({
    code: `
    const trigger = document.querySelector(".object_comments_faux_controls"); 
    if (trigger){
      trigger.click()
    } 
    window.setTimeout( ()=>{ 
      document.querySelector(".mce-content-body").innerHTML = "hello!" 
    }, 100 )`
  });
}

document.addEventListener('DOMContentLoaded', function() {
  const button = document.querySelector('.setComment');
  button.addEventListener('click', e => {
    e.preventDefault();
    setComment();
  });
});
