
function reveal_categories() {
  var div = document.getElementById("revealable_div");
  var button = document.getElementById("reveal_button");
  button.classList.toggle('rotated');
  if (div.style.flexGrow == 1) {
    div.style.flexGrow = 0.001;
    button.title = "Show Categories";
  } else {
    div.style.flexGrow = 1;
    button.title = "Hide Categories";
  }
}
