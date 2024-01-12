export default function decorate(block) { 
  const paragraph = document.createElement('p');
  paragraph.classList.add('button-container');


  const anchor = document.createElement('a');
  anchor.textContent = 'Click Me';
  anchor.classList.add('button');
  anchor.addEventListener('click', () => {
    alert('Do you just click on anything?');
  });

  paragraph.append(anchor);

  block.append(paragraph);
}