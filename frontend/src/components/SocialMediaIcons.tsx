import facebookIcon from '../assets/facebook.svg';
import instagramIcon from '../assets/instagram.svg';
import twitterIcon from '../assets/linkedin.svg';


const icons = [
  {
    name: 'Facebook',
    url: 'https://facebook.com/',
    src: facebookIcon,
  },
  {
    name: 'Instagram',
    url: 'https://instagram.com/',
    src: instagramIcon,
  },
  {
    name: 'LinkedIn',
    url: 'https://linkedin.com/',
    src: twitterIcon,
  }
];

const SocialMediaIcons = () => (
  <div className="social-icons">
    {icons.map(icon => (
      <a
        key={icon.name}
        href={icon.url}
        target="_blank"
        rel="noopener noreferrer"
        className="social-icon"
        aria-label={icon.name}
      >
        <img src={icon.src} alt={icon.name} width={32} height={32} />
      </a>
    ))}
  </div>
);

export default SocialMediaIcons;
