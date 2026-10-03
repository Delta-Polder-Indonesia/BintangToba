export const portfolioContent = {
  en: {
    navigation: 'about',
    languageLabel: 'English. Click to switch to Bahasa Indonesia',
    flagAlt: 'English flag',
    themeLabel: 'Change light or dark theme',
    menuLabel: 'Toggle navigation',
    imageAlt: 'Portrait of Bintang Toba',
    address: 'LB → KIS → SUMUT',
    contactNote: 'Feel free to reach out to me anytime on anything.',
    footer: 'Medan, North Sumatra. Hosted by',
    paragraphs: [
      <>Hello, I am an Electrical Engineering student at <ExternalLink href="https://www.pancabudi.ac.id">Universitas Pembangunan Panca Budi</ExternalLink> Medan, North Sumatra with a deep interest in advanced electronic systems and high-current electrical applications. Through this academic background, I keep sharpening my skills in electrical analysis, system architecture design, and technology optimisation for real-world industry application.</>,
      <>However, my interests do not stop at hardware. Outside of lectures, I challenge myself to learn software development independently. To me, coding is a creative space for translating engineering logic into practical digital solutions. On my GitHub repositories, I channel this learning process by building several web projects from scratch, from backend architecture up to the user interface. I developed <ExternalLink href="https://delta-polder-indonesia.github.io/ChessClub/">ChessClub</ExternalLink> as an interactive online chess arena platform, built <ExternalLink href="https://delta-polder-indonesia.github.io/projeck-kasir-cafe/">Project Kasir Cafe</ExternalLink>, a point-of-sale application for transaction management, and designed <ExternalLink href="https://delta-polder-indonesia.github.io/siakad-sekolah/">SIAKAD Sekolah</ExternalLink> to digitalise school academic information systems.</>,
      <>Beyond engineering and lines of code, I enjoy exploring fields that train the way I think. I study philosophy because it provides a clear framework for making life decisions, while financial markets draw my attention with their global dynamics and risk management under uncertainty. In my downtime, I often spend time enjoying competitive games or following the epic adventures of the One Piece series. Looking ahead, I want to keep moving at the intersection of hardware and software engineering, creating meaningful digital innovations that deliver value to many people.</>,
    ],
  },
  id: {
    navigation: 'tentang',
    languageLabel: 'Bahasa Indonesia. Klik untuk mengganti ke English',
    flagAlt: 'Bendera Indonesia',
    themeLabel: 'Ganti mode terang atau gelap',
    menuLabel: 'Buka atau tutup navigasi',
    imageAlt: 'Foto potret Bintang Toba',
    address: 'LB → KIS → SUMUT',
    contactNote: 'Jangan ragu untuk menghubungi saya kapan saja mengenai apa pun.',
    footer: 'Medan, Sumatera Utara. Dihosting oleh',
    paragraphs: [
      <>Halo, saya adalah mahasiswa Teknik Elektro di <ExternalLink href="https://www.pancabudi.ac.id">Universitas Pembangunan Panca Budi</ExternalLink> Medan, Sumatera Utara yang memiliki ketertarikan mendalam pada sistem elektronika tingkat lanjut dan aplikasi kelistrikan arus besar. Melalui latar belakang akademis ini, saya terus mengasah kemampuan dalam menganalisis kelistrikan, merancang arsitektur sistem, serta mengoptimalkan teknologi agar dapat diterapkan secara nyata di industri.</>,
      <>Namun, minat saya tidak berhenti pada perangkat keras. Di luar aktivitas perkuliahan, saya menantang diri untuk mempelajari pengembangan perangkat lunak secara mandiri. Bagi saya, coding adalah ruang kreatif untuk menerjemahkan logika teknik menjadi solusi digital yang praktis. Di repositori GitHub, saya menuangkan proses belajar ini dengan membangun beberapa proyek web dari nol, mulai dari arsitektur backend hingga tampilan antarmukanya. Saya mengembangkan <ExternalLink href="https://delta-polder-indonesia.github.io/ChessClub/">ChessClub</ExternalLink> sebagai platform arena catur online interaktif, membuat aplikasi Point-of-Sale berupa <ExternalLink href="https://delta-polder-indonesia.github.io/projeck-kasir-cafe/">Project Kasir Cafe</ExternalLink> untuk manajemen transaksi, serta merancang <ExternalLink href="https://delta-polder-indonesia.github.io/siakad-sekolah/">SIAKAD Sekolah</ExternalLink> guna mendigitalisasi sistem informasi akademik.</>,
      <>Di luar dunia teknik dan baris kode, saya senang menjelajahi bidang yang melatih cara berpikir. Saya mendalami filsafat karena memberikan kerangka berpikir yang jernih dalam mengambil keputusan hidup, sedangkan pasar keuangan menarik perhatian saya karena dinamika global dan manajemen risiko di tengah ketidakpastian. Saat sedang bersantai, saya kerap menghabiskan waktu dengan menikmati permainan kompetitif atau mengikuti petualangan epik dalam serial One Piece. Ke depannya, saya ingin terus bergerak di titik temu antara rekayasa perangkat keras dan perangkat lunak, menciptakan inovasi digital yang bermakna dan memberikan nilai bagi banyak orang.</>,
    ],
  },
};

function ExternalLink({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}
