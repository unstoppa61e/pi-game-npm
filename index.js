#!/usr/bin/env node

'use strict'

const readline = require('readline')
const chalk = require('chalk')
const { Select } = require('enquirer')
const { resolve, reject } = require('eslint-plugin-promise/rules/lib/promise-statics')

const piText = '3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679'
const piStartText = '3.'
const piBelowTheDecimalPoint = '1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679'
const digitsNum = 100
const piLastIndex = digitsNum - 1

function prepareProcessStdinForInput () {
  readline.emitKeypressEvents(process.stdin)
  process.stdin.setRawMode(true)
  process.stdin.resume()
}

function putFarewell () {
  console.clear()
  console.log(chalk.bold.green('Thank you for playing, my friend!'))
}

class PracticeMode {
  async start () {
    const prompt = await this.getStartingPointPrompt()
    const answer = await prompt.run().catch(() => {
      putFarewell()
      process.exit()
    })
    console.clear()
    if (answer < 1 || answer > digitsNum) {
      console.log(chalk.bold.red('Your input is out of the range.'))
      return this.start()
    }
    const startIndex = answer - 1
    const instruction = 'Keep typing in the number which fits the cursor position.'
    process.stdout.write(chalk.bold.green(instruction) + '\n\n' + piStartText + piBelowTheDecimalPoint.slice(0, startIndex))
    return this.startTypingSession(startIndex)
  }

  async startTypingSession (startIndex = 0) {
    return new Promise((resolve, reject) => {
      prepareProcessStdinForInput()
      let currentIndex = startIndex
      process.stdin.on('keypress', (char, key) => {
        if (key.ctrl && key.name === 'c') {
          putFarewell()
          process.exit();
        } else if (currentIndex === piLastIndex && char === piBelowTheDecimalPoint[piLastIndex]) {
          console.log(piBelowTheDecimalPoint[piLastIndex])
          this.putCongratulations()
          this.breakLoop(resolve)
        } else if (char === piBelowTheDecimalPoint[currentIndex]) {
          process.stdout.write(char)
          currentIndex++
        } else {
          const scoreMessage = `Your score: ${chalk.bold.green(currentIndex)}`
          const remainingDigitsText = this.make_remaining_digits_text(currentIndex)
          console.log(chalk.red(remainingDigitsText) + '\n\n' + scoreMessage)
          this.breakLoop(resolve)
        }
      })
    })
  }

  breakLoop (resolve) {
      process.stdin.removeAllListeners('keypress')
      process.stdin.pause()
      resolve()
  }

  async getStartingPointPrompt () {
    const { NumberPrompt } = require('enquirer')
    return new NumberPrompt({
      name: 'number',
      message: 'Set the starting point(1-100): '
    })
  }

  putCongratulations () {
    const message = this.buildCongratulationsMessage()
    console.log(chalk.bold.green(message))
  }

  buildCongratulationsMessage () {
    const headSpaces = ' '.repeat(6)
    const sentences = [
      'Congratulations!',
      `You have memorized the first ${digitsNum} digits of pi.`
    ]
    return sentences.map(sentence => {
      return headSpaces + sentence + '\n'
    }).join('')
  }

  make_remaining_digits_text (currentIndex) {
    let remaining_digits_text = ''
    const sectionDigitsNum = 10
    const lineDigitsNum = 50
    for (let i = currentIndex; i < digitsNum; i++) {
      if (i  === lineDigitsNum) {
        remaining_digits_text += '\n' + ' '.repeat(piStartText.length)
      } else if (i % sectionDigitsNum === 0) {
        remaining_digits_text += ' '
      }
      remaining_digits_text += piBelowTheDecimalPoint[i]
    }
    return remaining_digits_text
  }
}

class ShowPiMode {
  async start () {
    this.putPiText()
  }

  putPiText () {
    const pi_text = this.buildSeparatedPiText()
    console.log(pi_text)
  }

  buildSeparatedPiText () {
    // TODO: もっと良い方法
    const sectionHeadIndex = 2
    const sectionDigits = 10
    let pi_text = piText.slice(0, 2)
    for (let i = 0; i < 10; i++) {
      if (i !== 0 && i % 5 === 0) {
        pi_text += "\n  "
      } else if (i !== 0) {
        pi_text += ' '
      }
      pi_text += piText.substr(sectionHeadIndex + sectionDigits * i, 10)
    }
    return pi_text
  }
}

class Game {
  constructor () {
    this.practiceModeText = 'PRACTICE MODE'
    this.realModeText = 'REAL MODE'
    this.showPiDigitsModeText = 'SHOW PI DIGITS'
    this.quittingText = 'QUIT'
  }

  async buildPrompt () {
    const modes = [
      {
        name: this.practiceModeText,
        explanation: 'Check how many digits of pi you can name from the point you designated.'
      },
      {
        name: this.realModeText,
        explanation: 'Check how many digits of pi you can name.'
      },
      {
        name: this.showPiDigitsModeText,
        explanation: 'Check the first 100 digits of pi.'
      },
      {
        name: this.quittingText,
        explanation: 'Quit the game.'
      }
    ]
    return new Select({
      name: 'mode',
      message: 'Select your mode:',
      choices: modes.map(mode => mode.name),
      footer () {
        const explanations = modes.map(mode => ' '.repeat(2) + mode.explanation)
        return chalk.green('\n' + explanations[this.index])
      }
    })
  }

  async start () {
    this.putWelcomeMessage()
    const prompt = await this.buildPrompt().catch(() => putFarewell())
    const answer = await prompt.run().catch(() => putFarewell())
    console.clear()
    await this.playMode(answer).catch(() => putFarewell())
    prepareProcessStdinForInput()
    console.log('\nPress any key to return to the mode selection.')
    process.stdin.once('data', () => {
      console.clear()
      new Game().start()
    })
  }

  buildWelcomeMessage () {
    const repeatingTimes = 10
    return '>'.repeat(repeatingTimes) + ' PI GAME ' + '<'.repeat(repeatingTimes)
  }

  putWelcomeMessage () {
    console.clear()
    const welcomeMessage = this.buildWelcomeMessage()
    console.log(chalk.bold.green(welcomeMessage) + '\n')
  }

  playMode (answer) {
    switch (answer) {
      case this.practiceModeText:
        return new PracticeMode().start()
      case this.realModeText:
        break;
      case this.showPiDigitsModeText:
        return new ShowPiMode().start()
      case this.quittingText:
        putFarewell()
        process.exit()
    }
  }
}

new Game().start().catch(() => putFarewell())
