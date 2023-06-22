// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title MintableERC721
 * @dev ERC721 minting logic
 */
contract MetaFireERC721 is ERC721Enumerable {
  string public baseURI;
  mapping(address => uint256) public mintCounts;
  uint256 public tokenCount;
  uint256 private tokenCap = 5000;
  mapping (uint256 => string) private _tokenURIs;
  uint256 private _imageNum;
  uint256 public mintPrice;

  constructor(string memory nftName, string memory nftSymbol, uint256 _mintPrice,string memory _baseUri, uint8 imageNum) ERC721(nftName, nftSymbol) {
    baseURI = _baseUri;
    _imageNum = imageNum;
    mintPrice = _mintPrice;
    
  }

    /**
    * @dev Function to mint tokens
    * @return A boolean that indicates if the operation was successful.
    */
    function mint() public payable returns (bool) {
        require(msg.value >= mintPrice, "Insufficient ETH");
        require(tokenCount <= tokenCap, "exceed mint limit");

        mintCounts[_msgSender()] += 1;
        require(mintCounts[_msgSender()] <= 10, "exceed mint limit");
        tokenCount += 1;
        _mint(_msgSender(), tokenCount);

        uint256 metadataId;
        if (tokenCount % _imageNum == 0) {
            metadataId = _imageNum;
        } else {
            metadataId = tokenCount % _imageNum;
        }

        _setTokenURI(tokenCount, metadataId);

        return true; 
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        return _tokenURIs[tokenId];
    }

    function setBaseURI(string memory baseURI_) public {
        baseURI = baseURI_;
    }

    function _setTokenURI(uint256 _tokenId, uint256 _metadataId) internal virtual {
        bytes memory encodedTokenURI = abi.encodePacked(
            baseURI, 
            Strings.toString(_metadataId),
            ".json"
        );
        string memory cusTokenURI = string(encodedTokenURI);
        _tokenURIs[_tokenId] = cusTokenURI;
    }

    function setMintPrice(uint256 _mintPrice) public {
        mintPrice = _mintPrice;
    }
}