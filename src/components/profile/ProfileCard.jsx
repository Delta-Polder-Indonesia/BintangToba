import profileJpg from '../../assets/images/profile.jpg';
import profileWebp from '../../assets/images/profile.webp';

export default function ProfileCard({ imageAlt, address }) {
  return (
    <aside className="profile-card" aria-label="Profile">
      <picture>
        <source srcSet={profileWebp} type="image/webp" />
        <img
          src={profileJpg}
          width="800"
          height="800"
          fetchPriority="high"
          alt={imageAlt}
        />
      </picture>
      <p className="profile-address">{address}</p>
    </aside>
  );
}
