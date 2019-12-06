const Web3 = require('web3'),
  fs = require('fs'),
  contractAddr = require('../address')

const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))
const source = fs.readFileSync("../posts.json")
const contracts = JSON.parse(source)["contracts"]
const abi = JSON.parse(contracts["posts.sol:Posts"].abi)
const contract = new web3.eth.Contract(abi, contractAddr.contractAddress)

exports.addPost = async (title, description, addr) => {
  const addPost = contract.methods.addPost(title, description)
  const gas = await addPost.estimateGas()
  console.log("addPost gas: " + gas)
  const tx = await addPost.send({from: addr, gas: gas})
  console.log(tx.status ? "SUCCESS: Post added." : "Tx FAILED.")
  return tx.status
}

exports.countPosts = async () => {
  const c = await contract.methods.postCount().call()
  console.log("# Posts: " + c)
  return c
}

exports.getComment = async (commentId) => {
  let comment = await contract.methods.comments(commentId).call()
  
  const commentVotes = await contract.methods.getCommentVotes(commentId).call()
  for(let k = 0; k < commentVotes.length; k++) {
    const voteIndex = commentVotes[k]
    const vote = await contract.methods.votes(voteIndex).call()
    if(comment.votes) comment.votes.push(vote)
    else comment.votes = [ vote ]
  }

  const commentComments = await contract.methods.getCommentComments(commentId)
    .call()
  for(let k = 0; k < commentComments.length; k++) {
    const commentIndex = commentComments[k]
    const comments = await this.getComment(commentComments[k])
    if(comment.comments) comment.comments.push(comments)
    else comment.comments = [ comments ]
  }

  return comment
  
}

function getConsensus(obj) {
  let consensus = false 
  if(obj.votes) {
    let up = obj.votes[0].up
    for(let i = 1; i < obj.votes.length; i++) {
      consensus = up === obj.votes[i].up
    }
  }
  return consensus
}

function aggregateConsensus(obj, aggregator) {
  let consensus = getConsensus(obj)
  if(consensus) aggregator.push({
    id: obj.id,
    comment: obj.comment ? obj.comment : obj.title,
    type: obj.comment ? 'comment' : 'post' 
  })
  if(obj.comments) {
    for(let comment of obj.comments) {
      aggregateConsensus(comment, aggregator)
    }
  }
  return aggregator
}

exports.getPost = async (postId) => {
  let post = await contract.methods.posts(postId).call()

  const postVotes = await contract.methods.getPostVotes(postId).call()
  for(let j = 0; j < postVotes.length; j++) {
    const voteIndex = postVotes[j]
    const vote = await contract.methods.votes(voteIndex).call()
    if(post.votes) post.votes.push(vote)
    else post.votes = [ vote ]
  }

  const postComments = await contract.methods.getPostComments(postId).call()
  for(let j = 0; j < postComments.length; j++) {
    const comment = await this.getComment(postComments[j])
    if(post.comments) post.comments.push(comment)
    else post.comments = [ comment ]
  }

  post.consensus = aggregateConsensus(post, [])

  return post
}

exports.getPosts = async () => {
  const c = await contract.methods.postCount().call()
  let posts = []
  for(let i = 0; i < c; i++) {
    posts.push(await contract.methods.posts(i).call())
  }

  return posts
}

exports.votePost = async (postId, up, addr) => {
  const addVote = contract.methods.addVote(postId, up)
  const gas = await addVote.estimateGas()
  console.log("addVote gas: " + gas)
  const tx = await addVote.send({from: addr, gas: gas})
  console.log(tx.status ? "SUCCESS: Vote added." : "Tx FAILED.")
  return tx.status
}

exports.commentPost = async (postId, comment, addr) => {
  const addComment = contract.methods.addComment(postId, comment)
  const gas = await addComment.estimateGas()
  console.log("addComment gas: " + gas)
  const tx = await addComment.send({from: addr, gas: gas})
  console.log(tx.status ? "SUCCESS: Comment added." : "Tx FAILED.")
  return tx.status
}

exports.voteComment = async (commentId, up, addr) => {
  const addCommentVote = contract.methods.addCommentVote(commentId, up)
  const gas = await addCommentVote.estimateGas()
  console.log("addCommentVote gas: " + gas)
  const tx = await addCommentVote.send({from: addr, gas: gas})
  console.log(tx.status ? "SUCCESS: Voted on comment." : "Tx FAILED.")
  return tx.status
}

exports.commentComment = async (commentId, comment, addr) => {
  const addCommentComment = contract.methods.addCommentComment(commentId, comment)
  const gas = await addCommentComment.estimateGas()
  console.log("addCommentComment gas: " + gas)
  const tx = await addCommentComment.send({from: addr, gas: gas})
  console.log(tx.status ? "SUCCESS: Commented on comment." : "Tx FAILED.")
  return tx.status
}

/*
exports.addMember = (from, name, addr) => { 
  return new Promise((resolve, reject) => {
    ci.addMember(
      addr,
      name,
      {from: from, gas:1000000},
      () => {
        resolve({ 'msg': 'User added.'});
      }
    );
  });
};

exports.getMembers = () => { 
  var mems = [];
  for(var i = 0; i < ci.memberCount.call(); i++) {
    mems.push(ci.getMember.call(i));
  }
  return mems;
};

exports.removeMember = (from, addr) => {
   return new Promise(resolve => {
    ci.deactivateMember(
      addr,
      {from: from, gas:1000000},
      () => {
        resolve('User removed.');
      }
    );
  });
}

exports.getAddress = i => {
  return web3.eth.accounts[i];
};

exports.getActivity = (actId) => {
  return ci.getActivity.call(actId);
}

exports.getActivities = () => { 
  var acts = [];
  for(var i = 0; i < ci.activityCount.call(); i++) {
    acts.push(ci.getActivity.call(i));
  }
  return acts;
};

exports.addActivity = (from, cost, title, description, global) => {
  return new Promise(resolve => {
    ci.addActivity(
      cost,
      title,
      description, 
      global,
      {from: from, gas:4000000},
      () => {
        resolve({ 'msg': 'Activity added.' });
      }
    );
  });
};

exports.getBudget = () => {
  return ci.getCoopBudget.call();
};

exports.distributeBudget = (from) => {
  return new Promise(resolve => {
    ci.distributeBudget({from: from, gas: 1000000}, () => {
      resolve('distributeBudget...done.');
    });
  });
};

exports.getParticipants = actId => {
  return ci.getParticipants.call(actId);
};

exports.addParticipant = (from, memId, actId) => {
  return new Promise(resolve => {
    ci.addParticipant(
      memId,
      actId, 
      {from: from, gas:1000000},
      () => {
        resolve('Participant added.');
      }
    );
  });
};

exports.removeParticipant = (from, memId, actId) => {
  return new Promise(resolve => {
    ci.removeParticipant(
      memId,
      actId, 
      {from: from, gas:1000000},
      () => {
        resolve('Participant removed.');
      }
    );
  });
};

exports.getVoteIds = actId => {
  return ci.getVoteIds.call(actId);
};

exports.getVote = voteId => {
  return ci.getVote.call(voteId);
};

exports.vote = (from, actId, prom, just) => {
  console.log(from, actId, prom, just);
  return new Promise(resolve => {
    ci.vote(
      actId,
      prom,
      just,
      {from: from, gas:1000000},
      () => {
        resolve('Vote added.');
      }
    );
  });
};

exports.deleteVote = (from, voteId) => {
  return new Promise(resolve => {
    ci.deleteVote(
      voteId,
      {from: from, gas:1000000},
      () => {
        resolve('Vote removed.');
      }
    );
  });
};

exports.finalize = (from, actId) => {
  return new Promise(resolve => {
    ci.finalize(
      actId,
      {from: from, gas:1000000},
      () => {
        resolve('Activity finalized.');
      }
    );
  });
};
*/

exports.unlockAccount = (addr, password) => { 
  web3.eth.personal.unlockAccount(addr, password)
};

