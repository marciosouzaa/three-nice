// A soft, filtered noise bed with a slow swell. Audio starts only on request.
export function createOceanAudio() {
  const context = new AudioContext()
  const buffer = context.createBuffer(
    2,
    context.sampleRate * 6,
    context.sampleRate,
  )
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel)
    let previous = 0
    for (let i = 0; i < data.length; i++) {
      previous = (previous + (Math.random() * 2 - 1) * 0.025) / 1.025
      data[i] = previous * 3.5
    }
  }
  const source = context.createBufferSource()
  source.buffer = buffer
  source.loop = true
  const filter = context.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 1100
  const swell = context.createGain()
  swell.gain.value = 0.6
  const oscillator = context.createOscillator()
  oscillator.frequency.value = 0.12
  const modulation = context.createGain()
  modulation.gain.value = 0.25
  oscillator.connect(modulation).connect(swell.gain)
  const master = context.createGain()
  master.gain.value = 0
  source
    .connect(filter)
    .connect(swell)
    .connect(master)
    .connect(context.destination)
  source.start()
  oscillator.start()
  let stopped = false
  return {
    async start() {
      await context.resume()
      if (!stopped)
        master.gain.linearRampToValueAtTime(0.42, context.currentTime + 1.5)
    },
    stop() {
      stopped = true
      if (context.state === 'closed') return
      master.gain.cancelScheduledValues(context.currentTime)
      master.gain.setValueAtTime(master.gain.value, context.currentTime)
      master.gain.linearRampToValueAtTime(0, context.currentTime + 0.4)
      window.setTimeout(() => {
        source.stop()
        oscillator.stop()
        void context.close()
      }, 450)
    },
  }
}
