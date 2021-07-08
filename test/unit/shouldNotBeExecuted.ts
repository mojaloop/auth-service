export default function shouldNotBeExecuted () {
  throw new Error('test failure enforced: this code should never be executed')
}
