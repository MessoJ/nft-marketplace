import { useState, useEffect, useContext } from 'react';

import { NFTContext } from '../context/NFTContext';
import { Loader, NFTCard, SearchBar } from '../components';

const ListedNFTs = () => {
  const { fetchMyNFTsOrListedNFTs, isLoadingNFT } = useContext(NFTContext);
  const [nfts, setNfts] = useState([]);
  const [nftsCopy, setNftsCopy] = useState([]);
  const [activeSelect, setActiveSelect] = useState('Recently Added');

  useEffect(() => {
    fetchMyNFTsOrListedNFTs('fetchItemsListed')
      .then((items) => {
        setNfts(items);
        setNftsCopy(items);
      });
  }, []);

  useEffect(() => {
    const sortedNfts = [...nfts];

    switch (activeSelect) {
      case 'Price (low to high)':
        setNfts(sortedNfts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price)));
        break;
      case 'Price (high to low)':
        setNfts(sortedNfts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price)));
        break;
      case 'Recently Added':
        setNfts(sortedNfts.sort((a, b) => b.tokenId - a.tokenId));
        break;
      default:
        setNfts(nfts);
        break;
    }
  }, [activeSelect]);

  const onHandleSearch = (value) => {
    const filteredNfts = nfts.filter(({ name }) => name.toLowerCase().includes(value.toLowerCase()));

    if (filteredNfts.length === 0) {
      setNfts(nftsCopy);
    } else {
      setNfts(filteredNfts);
    }
  };

  const onClearSearch = () => {
    if (nfts.length && nftsCopy.length) {
      setNfts(nftsCopy);
    }
  };

  if (isLoadingNFT) {
    return (
      <div className="flexStart min-h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex justify-center sm:px-4 p-12 min-h-screen">
      <div className="w-full minmd:w-4/5">
        <div className="mt-4">
          <h2 className="font-poppins dark:text-white text-nft-black-1 text-2xl font-semibold ml-4 sm:ml-2">
            NFTs Listed for Sale
          </h2>
          <div className="mt-3 w-full flex flex-wrap justify-start md:justify-center">
            {!isLoadingNFT && !nfts.length ? (
              <h1 className="font-poppins dark:text-white text-nft-black-1 text-2xl font-semibold mt-5">
                You have not listed any NFTs yet
              </h1>
            ) : isLoadingNFT ? (
              <Loader />
            ) : (
              <>
                <div className="flex-1 w-full flex flex-row sm:flex-col px-4 xs:px-0 minlg:px-8">
                  <SearchBar
                    activeSelect={activeSelect}
                    setActiveSelect={setActiveSelect}
                    handleSearch={onHandleSearch}
                    clearSearch={onClearSearch}
                  />
                </div>
                <div className="mt-3 w-full flex flex-wrap">
                  {nfts.map((nft) => <NFTCard key={nft.tokenId} nft={nft} onProfilePage />)}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListedNFTs;
