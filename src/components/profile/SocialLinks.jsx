import { CodeIcon, GitHubIcon, MailIcon } from '../ui/Icons.jsx';

const socialLinks = [
  { href: 'mailto:trianandaadisti04@gmail.com', label: 'Email Tria Nanda Adisti', title: 'Email', icon: MailIcon },
  { href: 'https://github.com/Delta-Polder-Indonesia', label: 'GitHub Delta Polder Indonesia', title: 'GitHub', icon: GitHubIcon },
  { href: 'https://greasyfork.org/id/users/1575724-bintang-toba', label: 'Profil Greasy Fork Bintang Toba', title: 'Greasy Fork', icon: CodeIcon },
];

export default function SocialLinks({ note }) {
  return (
    <section className="social-links" aria-label="Contact links">
      <div className="social-icons">
        {socialLinks.map(({ href, label, title, icon: Icon }) => (
          <a
            key={href}
            href={href}
            aria-label={label}
            title={title}
            target={href.startsWith('mailto:') ? undefined : '_blank'}
            rel={href.startsWith('mailto:') ? undefined : 'noreferrer'}
          >
            <Icon />
          </a>
        ))}
      </div>
      <p className="contact-note">{note}</p>
    </section>
  );
}
