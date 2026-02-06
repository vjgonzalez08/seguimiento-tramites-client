import Image from 'next/image';

export default function Home() {
  return (
    <div
      style={{
        minHeight: '50vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Image
        src="https://cdnwordpresstest-f0ekdgevcngegudb.z01.azurefd.net/es/wp-content/themes/theme_alcaldia/logos/logo_footer.png"
        alt="Alcaldía de Medellín"
        width={420}
        height={126}
        priority
        style={{
          maxWidth: '60%',
          height: 'auto',
        }}
      />
    </div>
  );
}
