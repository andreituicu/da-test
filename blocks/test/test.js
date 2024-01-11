export default function decorate(block) { 
  const anchor = document.createElement('a');
  anchor.textContent('Click Me');
  anchor.classList.add('button');
  anchor.classList.add('primary');
  anchor.addEventListener('click', () => {
    alert('Do you just click on anything?');
  });

  block.append(anchor);
}