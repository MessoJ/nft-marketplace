import '../styles/globals.css';
import { ThemeProvider } from 'next-themes';
import { NFTProvider } from '../context/NFTContext';
import { Navbar, Footer } from '../components';
import Head from 'next/head';

function MyApp({ Component, pageProps }) {
  return (
    <NFTProvider>
      <ThemeProvider attribute="class">
        <div className="dark:bg-nft-dark bg-white min-h-screen">
          <Head>
            <title>NFT Marketplace</title>
            <meta name="description" content="Discover, collect, and sell extraordinary NFTs" />
            <link rel="icon" href="/favicon.ico" />
          </Head>
          <Navbar />
          <div className="pt-65">
            <Component {...pageProps} />
          </div>
          <Footer />
        </div>
      </ThemeProvider>
    </NFTProvider>
  );
}

export default MyApp;
