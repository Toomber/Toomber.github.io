
function reveal_categories() {
  var div = document.getElementById("revealable_div");
  var button = document.getElementById("reveal_button");
  div.classList.toggle('revealed');
  button.classList.toggle('rotated');
  if (div.classList.contains('revealed')) {
    button.title = "Hide Categories";
  } else {
    button.title = "Show Categories";
  }
}
