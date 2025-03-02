import { useState, useEffect, useContext } from 'react';
import { NFTContext } from '../context/NFTContext';
import { Banner, CreatorCard, NFTCard, Loader } from '../components';
import Image from 'next/image';
import images from '../assets';
import { useTheme } from 'next-themes';
import { shortenAddress } from '../utils/shortenAddress';

const Home = () => {
  const { theme } = useTheme();
  const { fetchNFTs, isLoadingNFT } = useContext(NFTContext);
  const [nfts, setNfts] = useState([]);
  const [hideButtons, setHideButtons] = useState(false);
  const [activeSelect, setActiveSelect] = useState('Recently added');

  useEffect(() => {
    fetchNFTs()
      .then((items) => {
        setNfts(items);
      });
  }, []);

  const onHandleSearch = (value) => {
    const filteredNfts = nfts.filter(({ name }) => name.toLowerCase().includes(value.toLowerCase()));

    if (filteredNfts.length) {
      setNfts(filteredNfts);
    }
  };

  const onClearSearch = () => {
    fetchNFTs()
      .then((items) => {
        setNfts(items);
      });
  };

  const handleScroll = (direction) => {
    const scrollContainer = document.getElementById('scrollableDiv');

    const scrollAmount = 250;
    if (direction === 'left') {
      scrollContainer.scrollLeft -= scrollAmount;
    } else {
      scrollContainer.scrollLeft += scrollAmount;
    }
  };

  const topCreators = [
    { rank: 1, name: 'Spiderman', address: '0x123..', image: images.creator1 },
    { rank: 2, name: 'Ironman', address: '0x456..', image: images.creator2 },
    { rank: 3, name: 'Black Widow', address: '0x789..', image: images.creator3 },
    { rank: 4, name: 'Thor', address: '0xabc..', image: images.creator4 },
    { rank: 5, name: 'Captain America', address: '0xdef..', image: images.creator5 },
  ];

  return (
    <div className="flex justify-center sm:px-4 p-12">
      <div className="w-full minmd:w-4/5">
        <Banner
          parentStyles="justify-start mb-6 h-72 sm:h-60 p-12 xs:p-4 xs:h-44 rounded-3xl"
          childStyles="md:text-4xl sm:text-2xl xs:text-xl text-left"
          name="Discover, collect, and sell extraordinary NFTs"
        />

        <div className="flex flex-col-reverse sm:flex-col">
          <div className="flex flex-1 flex-row sm:flex-col px-4 xs:px-0 minlg:px-8">
            <h1 className="font-poppins dark:text-white text-nft-black-1 text-2xl minlg:text-4xl font-semibold sm:mb-4 flex-1">
              Top Creators
            </h1>

            <div className="flex flex-row sm:w-full sm:flex-col">
              {!hideButtons && (
                <div className="flex flex-row">
                  <div
                    className="mx-2 my-1 cursor-pointer"
                    onClick={() => handleScroll('left')}
                  >
                    <Image
                      src={images.left}
                      width={24}
                      height={24}
                      alt="left_arrow"
                      className={theme === 'light' ? 'filter invert' : ''}
                    />
                  </div>
                  <div
                    className="mx-2 my-1 cursor-pointer"
                    onClick={() => handleScroll('right')}
                  >
                    <Image
                      src={images.right}
                      width={24}
                      height={24}
                      alt="right_arrow"
                      className={theme === 'light' ? 'filter invert' : ''}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div
            className="flex flex-1 flex-row overflow-x-scroll no-scrollbar"
            id="scrollableDiv"
          >
            {topCreators.map((creator, i) => (
              <CreatorCard
                key={creator.address}
                rank={creator.rank}
                creatorImage={creator.image}
                creatorName={creator.name}
                creatorAddress={creator.address}
              />
            ))}
          </div>
        </div>

        <div className="mt-10">
          <div className="flexBetween mx-4 xs:mx-0 minlg:mx-8 sm:flex-col sm:items-start">
            <h1 className="flex-1 font-poppins dark:text-white text-nft-black-1 text-2xl minlg:text-4xl font-semibold sm:mb-4">
              Hot NFTs
            </h1>

            <div className="flex-2 sm:w-full flex flex-row sm:flex-col">
              <div
                className="flex flex-row border dark:border-nft-black-2 border-nft-gray-2 rounded-lg w-full minlg:w-[45%]"
              >
                <Image
                  src={images.search}
                  width={20}
                  height={20}
                  alt="search"
                  className={`inline-block mr-3 ml-4 ${theme === 'light' ? 'filter invert' : ''}`}
                />
                <input
                  type="text"
                  placeholder="Search NFTs here..."
                  className="flex-1 w-full dark:bg-nft-black-2 bg-white outline-none text-nft-gray-2 text-base p-2"
                  onChange={(e) => {
                    onHandleSearch(e.target.value);
                  }}
                />
              </div>

              <div className="flex flex-row ml-4 sm:ml-0 sm:mt-4">
                <div className="flex flex-1 cursor-pointer">
                  <p className="font-poppins dark:text-white text-nft-black-1 font-normal text-xs minlg:text-lg">
                    Recently Added
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 w-full flex flex-wrap justify-start md:justify-center">
            {isLoadingNFT ? (
              <Loader />
            ) : nfts.length === 0 ? (
              <div className="flexCenter sm:p-4 p-16">
                <h1 className="font-poppins dark:text-white text-nft-black-1 text-3xl font-extrabold">
                  No NFTs for sale
                </h1>
              </div>
            ) : (
              nfts.map((nft) => <NFTCard key={nft.tokenId} nft={nft} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
