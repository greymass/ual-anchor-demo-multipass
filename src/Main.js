// React and UI components for demo
import React, { Component } from 'react'
import { Button, Container, Header, Segment } from 'semantic-ui-react'

// The required ual includes
import { withUAL } from 'ual-reactjs-renderer'

// React components for this demo, not required
import Accounts from './Accounts.js'
import Blockchains from './Blockchains.js'
import Response from './Response.js'

class App extends Component {
  // Demo initialization code
  constructor(props) {
    super(props)
    // Set initial blank application state
    this.state = {
      proofKey: undefined,
      proofValid: undefined,
      response: undefined,
      session: undefined,
      sessions: [],
      transacting: false,
    }
  }
  componentDidUpdate(prevProps, prevState, snapshot) {
    // If a new user record was loaded, check it's signature
    const { activeUser } = this.props.ual
    if (!prevProps.ual.activeUser && activeUser) {
      const {
        chainId,
        signerKey,
        signerProof,
        signerRequest
      } = activeUser
      if (signerKey && signerProof && signerRequest) {
        const proofKey = signerProof.recoverDigest(signerRequest.signingDigest(chainId))
        const proofValid = proofKey.equals(signerKey)
        this.setState({
          proofValid,
          proofKey: String(proofKey)
        })
      }
    }
  }
  addAccount = () => {
    this.props.ual.showModal()
  }
  signTransaction = async (variant) => {
    // Retrieve current session from state
    const { ual: { activeUser } } = this.props
    this.setState({
      // Reset our response state to clear any previous transaction data
      response: undefined,
      // Set loading flag
      transacting: true,
    })
    try {
      // Determine our auth from the current authenticator
      let actor;
      let permission;
      if (activeUser.scatter) {
        const [ current ] = activeUser.scatter.identity.accounts;
        actor = current.name
        permission = current.authority
      }
      if (activeUser.session) {
        actor = activeUser.accountName
        permission = activeUser.requestPermission
      }
      let actions = []
      switch(variant) {
        // Transaction Variant 1 (works on NFTHive)
        case 1: 
        default: {
            actions = [
                {
                    "account": "nft.hive",
                    "name": "boost",
                    "authorization": [
                        {
                            "actor": "............1",
                            "permission": "............2"
                        }
                    ],
                    "data": "90d5d415d1894d73"
                },
                {
                    "account": "atomicmarket",
                    "name": "announcesale",
                    "authorization": [
                        {
                            "actor": "............1",
                            "permission": "............2"
                        }
                    ],
                    "data": "90d5d415d1894d73016542d90500010000009236bb1c000000085741580000000008574158000000000000006abb06f29a"
                },
                {
                    "account": "atomicassets",
                    "name": "createoffer",
                    "authorization": [
                        {
                            "actor": "............1",
                            "permission": "............2"
                        }
                    ],
                    "data": "90d5d415d1894d739015bc4622276936016542d90500010000000473616c65"
                }
            ]
            break;
        }
        // Transaction Variant 1 (fails on NFTHive)
        case 2: {
            actions = [
                {
                    "account": "nft.hive",
                    "name": "boost",
                    "authorization": [
                        {
                            "actor": "............1",
                            "permission": "............2"
                        }
                    ],
                    "data": "90d5d415d1894d73"
                },
                {
                    "account": "eosio.token",
                    "name": "transfer",
                    "authorization": [
                        {
                            "actor": "............1",
                            "permission": "............2"
                        }
                    ],
                    "data": "90d5d415d1894d73802bbd496dd7f29a00cf1413040000000857415800000000076465706f736974"
                },
                {
                    "account": "nfthivedrops",
                    "name": "claimdrop",
                    "authorization": [
                        {
                            "actor": "............1",
                            "permission": "............2"
                        }
                    ],
                    "data": "90d5d415d1894d73a40f000000000000010000000000000000000000086e66742e686976650255530857415800000000"
                }
            ]
            break
        }
      }


      // Call transact on the session
      const response = await activeUser.signTransaction({
        actions
      }, {
        // Optional: Whether anchor-link should broadcast this transaction
        //    For this demo, anchor-link will not broadcast the transaction after receiving it
        broadcast: false,
        // Optional: Force using the last irreversible block for tapos
        useLastIrreversible: true,
        // Optional: TAPOS values
        // blocksBehind: 3,
        // expireSeconds: 120,
      })
      // Update application state with the results of the transaction
      this.setState({
        response,
        transacting: false,
      })
    } catch(e) {
      console.log(e)
      this.setState({
        // Set loading flag
        transacting: false,
      })
    }
  }
  // React State Helper to update sessions while switching accounts
  setSession = async (auth) => {
    // Restore a specific session based on appName and auth
    const session = await this.link.restoreSession(this.props.appName, auth)
    // Update application state with new session and reset response data
    this.setState({
      response: undefined,
      session,
    })
  }
  // React State Helper to remove/delete a session
  removeSession = async (auth) => {
    const { ual: { logout } } = this.props
    logout();
  }
  render() {
    // Load state for rendering
    const {
      proofKey,
      proofValid,
      response,
      transacting,
    } = this.state
    const {
      chain,
    } = this.props
    const { ual: { activeUser } } = this.props
    const { ual: { users } } = this.props
    let signerProof;
    if (proofValid && activeUser) {
      ({ signerProof } = activeUser);
    }
    // Return the UI
    return (
      <Container
        style={{ paddingTop: '2em' }}
      >
        <Header attached="top" block size="huge">
          ual-reactjs-renderer-demo-multipass
          <Header.Subheader>
            <p>An UAL demo using the ual-reactjs-renderer that allows multiple persistent logins from different wallets, blockchains, and accounts.</p>
            <p>Source code: <a href="https://github.com/greymass/ual-reactjs-renderer-demo-multipass">https://github.com/greymass/ual-reactjs-renderer-demo-multipass</a></p>
          </Header.Subheader>
        </Header>
        <Segment attached padded>
          <p>Switch to a specific blockchain.</p>
          <Blockchains
            chain={chain}
            onChange={this.props.setChainId}
          />
        </Segment>
        <Segment attached padded>
          <Header>Available Accounts</Header>
          <Accounts
            activeUser={activeUser}
            addAccount={this.addAccount}
            chain={chain}
            setSession={this.setSession}
            removeSession={this.removeSession}
            users={users}
          />
        </Segment>
        {(proofValid)
          ? (
            <Segment attached padded>
              <Header>Identity Proof provided with Login</Header>
              <p>Signed with Key: {String(proofKey)}</p>
              <p>Signed Proof: {String(signerProof)}</p>
              <p>Signature Valid: {proofValid ? 'Yes' : 'No'}</p>
            </Segment>
          )
          : false
        }
        <Segment attached={response ? true : 'bottom'} padded>
          <Header>Transact with UAL</Header>
          <Button
            content="Test Transaction 1"
            disabled={!activeUser || transacting}
            loading={transacting}
            icon="external"
            onClick={() => this.signTransaction(1)}
            primary
            size="huge"
          />
          <Button
            content="Test Transaction 2"
            disabled={!activeUser || transacting}
            loading={transacting}
            icon="external"
            onClick={() => this.signTransaction(2)}
            primary
            size="huge"
          />
          {(!activeUser)
            ? <p style={{ marginTop: '0.5em'}}>Login using UAL to sign a test transaction.</p>
            : false
          }
        </Segment>
        {(response)
          ? (
            <Segment attached="bottom" padded>
              <Header>Transaction Response</Header>
              <Response
                response={response}
              />
            </Segment>
          )
          : false
        }
      </Container>
    )
  }
}

// ensure this component is exported withUAL
export default withUAL(App)
