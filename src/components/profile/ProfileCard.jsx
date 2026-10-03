import profileJpg from '../../assets/images/profile.jpg';
import profileWebp from '../../assets/images/profile.webp';

export default function ProfileCard({ imageAlt, address }) {
  return (
    <div className="profile float-right">
      <picture>
        <source srcSet={profileWebp} type="image/webp" />
        <img
          className="img-fluid z-depth-1 rounded"
          src={profileJpg}
          width="800"
          height="800"
          fetchPriority="high"
          alt={imageAlt}
        />
      </picture>
      <div className="address">
        <p>{address}</p>
      </div>
    </div>
  );
}
