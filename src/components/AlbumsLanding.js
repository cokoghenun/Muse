import gql from 'graphql-tag';
import './AlbumsLanding.css';
import LazyLoad from 'react-lazyload';
import { Link } from 'react-router-dom';
import apolloClient from '../apolloClient';
import LandingSearch from './LandingSearch';
import SearchNotFound from './SearchNotFound';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import useError from './hooks/useError';
import { useQuery } from '@apollo/react-hooks';
import useSpinner from './hooks/useSpinner';

const LazyLoadPlaceholder = () => (
  <div className='aLanding__list__album loading'>
    <div
      className='aLanding__list__album__cover'
      style={{ backgroundImage: `` }}
    ></div>
    <div className='aLanding__list__album__cover__info'>
      <div className='aLanding__list__album__cover__info__name truncate'></div>
      <div className='aLanding__list__album__cover__info__artist truncate'></div>
    </div>
  </div>
);

const AlbumsLanding = ({ path }) => {
  const page = useRef(0);
  const count = useRef(null);
  const albumCache = useRef([]);
  const [hasMore, setHasMore] = useState(true);
  const [searchVal, setSearchVal] = useState('');
  const [albumsDisplay, setAlbumsDisplay] = useState([]);
  const [ErrModal, showErrModal] = useError(
    'An error occured while trying to get Albums',
    reFetchAlbums
  );
  const [Spinner, setIsLoading] = useSpinner(true);

  const fetchAlbums = useCallback(async () => {
    page.current = page.current + 1;
    setHasMore(true);
    setIsLoading(true);
    try {
      const { data } = await apolloClient.query({
        query: gql`
        query {
          allAlbums(page: ${page.current}) {
            _id
            cover
            name
            artist {
              name
            }
          }
        }
      `
      });
      if (data) {
        setIsLoading(false);
        showErrModal(false);
        albumCache.current = albumCache.current.concat(data.allAlbums);
        setAlbumsDisplay(albumCache.current);
      }
      if (albumCache.current.length === Number(count.current)) {
        setHasMore(false);
      }
    } catch (err) {
      console.log(err);
      showErrModal(true);
      setIsLoading(false);
    }
  }, [setIsLoading, showErrModal]);

  function reFetchAlbums() {
    fetchAlbums();
  }

  // function shuffle(array) {
  //   let currentIndex = array.length,
  //     temporaryValue,
  //     randomIndex;

  //   while (0 !== currentIndex) {
  //     randomIndex = Math.floor(Math.random() * currentIndex);
  //     currentIndex -= 1;

  //     temporaryValue = array[currentIndex];
  //     array[currentIndex] = array[randomIndex];
  //     array[randomIndex] = temporaryValue;
  //   }
  //   return array;
  // }

  // shuffle(albums);

  const setSearch = useCallback(
    async (query, cat) => {
      // handleSearch(query, cat);
      setSearchVal(query);
      try {
        if (query) {
          setIsLoading(false);
          setAlbumsDisplay([]);
          const { data } = await apolloClient.query({
            query: gql`
           query {
             searchAlbums(query: "${query}") {
               _id
               cover
               name
               artist {
                 name
               }
             }
           }
         `
          });

          setIsLoading(false);
          setHasMore(false);
          setAlbumsDisplay(data.searchAlbums);
        } else {
          fetchAlbums();
        }
      } catch (err) {
        console.log(err);
        setHasMore(false);
        showErrModal(true);
        setIsLoading(false);
      }
    },
    [fetchAlbums, setIsLoading, showErrModal]
  );

  useEffect(() => {
    fetchAlbums();
    (async () => {
      // console.log(path)
      const { data } = await apolloClient.query({
        query: gql`
          query {
            count(type: "album")
          }
        `
      });
      count.current = data.count;
    })();
  }, [fetchAlbums]);
  return (
    <div
      className='aLanding'
      onScroll={({ target }) => {
        console.log('scrolling');
        console.log(
          target.getBoundingClientRect().bottom <= window.innerHeight
        );
      }}
    >
      <ErrModal />

      <LandingSearch
        path={path}
        getSearchVal={setSearch}
        pageState={albumsDisplay}
        setPageState={setAlbumsDisplay}
      />
      <Spinner />
      <div className='aLanding__list'>
        <InfiniteScroll
          hasMore={hasMore}
          next={fetchAlbums}
          dataLength={albumsDisplay.length}
          className={'aLanding__list--scroller'}
          loader={
            <div className='infinite__scroll__loader' key={0}>
              <div data-img data-imgname='loading' />
            </div>
          }
        >
          {albumsDisplay.length ? (
            albumsDisplay.map((a, k) => (
              <LazyLoad key={k} placeholder={<LazyLoadPlaceholder />}>
                <Link
                  to={{
                    pathname: `/view/album/${a.name}/${a._id}`
                  }}
                >
                  <div key={k} className='aLanding__list__album'>
                    <div
                      className='aLanding__list__album__cover'
                      style={{ backgroundImage: `url(${a.cover})` }}
                    ></div>
                    <div className='aLanding__list__album__cover__info'>
                      <div className='aLanding__list__album__cover__info__name truncate'>
                        {a.name}
                      </div>
                      <div className='aLanding__list__album__cover__info__artist truncate'>
                        {a.artist.map((a, k) =>
                          k > 0 ? ' / ' + a.name : a.name
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </LazyLoad>
            ))
          ) : searchVal.length ? (
            <SearchNotFound />
          ) : (
            ''
          )}
        </InfiniteScroll>
      </div>
    </div>
  );
};

export default AlbumsLanding;
