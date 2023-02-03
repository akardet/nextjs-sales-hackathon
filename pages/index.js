import { useEffect, useState } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import Confetti from 'react-confetti'

import useWindowSize from 'react-use/lib/useWindowSize'

import { getEntries } from './api/entries'

import styles from '@/styles/Home.module.css'

const GAME_STATUS = {
  WON: "won",
  LOST: "lost",
  PLAYING: "playing",
  COMPLETE: "complete"
}

export default function Home({ data }) {
  const [gameState, setGameState] = useState({
    person: "",
    status: GAME_STATUS.PLAYING
  })
  const { width, height } = useWindowSize()
  const [people, setPeople] = useState(data.items)
  const [inputValue, setInputValue] = useState("")
  const [currentPerson, setCurrentPerson] = useState(null)
  const [currentPersonPictures, setCurrentPersonPictures] = useState([])
  const [currentPicture, setCurrentPicture] = useState(null)
  const [pictureIndex, setPictureIndex] = useState(0)

  const imageLoader = ({ src }) => {
    return `https://${src}`
  }

  const updatePerson = () => {
    let currentPeople = people

    if (currentPerson) {
      const currentPersonIndex = currentPeople.findIndex(person => person.fields.name === currentPerson.fields.name)
      currentPeople.splice(currentPersonIndex, 1)
      setPeople(currentPeople)
    }

    const randomNum = Math.floor(Math.random() * currentPeople.length);
    const person = currentPeople[randomNum]

    if (person) {
      setCurrentPerson(person)
    }

    return person
  }

  const isEqual = (value, guessed) => {
    if (!guessed.length) return false

    return (value.toLowerCase()).startsWith(guessed.toLowerCase())
  }

  const updateInput = (e) => {
    setInputValue(e.target.value)
  }


  const resetGame = (e) => {
    e.preventDefault()
    const person = updatePerson()

    if (person) {
      setPictureIndex(0)
      setGameState({
        person: person.fields.name,
        status: GAME_STATUS.PLAYING
      })
    } else {
      setGameState({
        person: "",
        status: GAME_STATUS.COMPLETE
      })
    }
  }

  const checkValue = (e) => {
    e.preventDefault();

    if (gameState.status !== GAME_STATUS.PLAYING) return

    const currentPersonFullPicture = data?.includes?.Asset.find(asset => asset.sys.id === currentPerson.fields.fullPicture.sys.id)

    if (isEqual(gameState.person, inputValue)) {
      setGameState({
        person: "",
        status: GAME_STATUS.WON
      })

      setCurrentPicture(currentPersonFullPicture)
    } else {
      if (currentPersonPictures[pictureIndex + 1]) {
        setPictureIndex(pictureIndex + 1)
      } else {
        setCurrentPicture(currentPersonFullPicture)
        setGameState({
          person: "",
          status: GAME_STATUS.LOST
        })
      }
    }

    setInputValue("")
  }

  // Set person
  useEffect(() => {
    if (!currentPerson) {
      const person = updatePerson()

      setGameState({
        person: person.fields.name,
        status: GAME_STATUS.PLAYING
      })
    }
  }, [currentPerson])

  // Set person pictures
  useEffect(() => {
    if (currentPerson && currentPerson?.fields) {
      const currentPersonAssets = currentPerson?.fields?.clips.map(asset => asset?.sys?.id)
      const assets = data?.includes?.Asset

      const pictureSet = assets.reduce((acc, curr) => {
        const currId = curr?.sys?.id

        if (currentPersonAssets.includes(currId)) {
          if (!acc.length) {
            return [curr]
          }

          return [curr, ...acc]
        }

        return acc
      }, [])


      pictureSet.sort((a, b) => {
        if (a.fields.title < b.fields.title) {
          return -1;
        }
        if (a.fields.title > b.fields.title) {
          return 1;
        }
        return 0;
      })

      setCurrentPersonPictures(pictureSet)
    }
  }, [currentPerson])

  // Set main picture
  useEffect(() => {
    if (currentPersonPictures.length) {
      if (currentPersonPictures[pictureIndex]) {
        setCurrentPicture(currentPersonPictures[pictureIndex])
      }
    }
  }, [currentPersonPictures, currentPerson, pictureIndex])

  return (
    <>
      <Head>
        <title>NetliFramed</title>
        <meta name="description" content="Guess who" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <section className={styles.section}>
          {currentPicture &&
            <Image
              loader={imageLoader}
              src={currentPicture?.fields?.file?.url}
              className={styles.image}
              alt="Guess the person"
              width={512}
              height={512}
              priority
            />
          }
          <form onSubmit={checkValue}>
            <input className={styles.input} type="text" placeholder="Guess the person or submit to skip" value={inputValue} onChange={updateInput}></input>
            <input className={[styles.button, styles.submitButton].join(" ")} type="submit" value="Submit" />
          </form>

          {gameState.status === GAME_STATUS.WON && <p>Correct!</p>}
          {gameState.status === GAME_STATUS.LOST && <p>You Lost!</p>}
          {gameState.status === GAME_STATUS.PLAYING && <p>You are playing...</p>}
          {gameState.status === GAME_STATUS.COMPLETE && <p>You've complete the game!</p>}
          <button className={[styles.button, styles.newGameButton].join(" ")} type="button" onClick={resetGame}>New Person</button>
        </section>
        {gameState.status === GAME_STATUS.WON && <Confetti width={width} height={height} />}
      </main>
    </>
  )
}

export async function getStaticProps({ params, preview = false }) {
  const data = await getEntries()

  return {
    props: {
      preview,
      data: data ?? null,
    },
  }
}