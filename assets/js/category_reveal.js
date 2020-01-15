
function reveal_categories() {
  var div = document.getElementById("revealable_div");
  var button = document.getElementById("reveal_button");
  div.classList.toggle('revealed');
  button.classList.toggle('rotated');
  if (div.style.flexGrow == 1) {
    button.title = "Show Categories";
  } else {
    button.title = "Hide Categories";
  }
}
