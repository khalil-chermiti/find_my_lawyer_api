rechercher un avocat
  - par nom
  - par specialité
  - par ville

/avocat/search
  const search = {
    name : string
    speciality : string
    city : string
  }

  this.avocatModel.find({
    name : search.name,
    speciality : search.speciality,
    city : search.city
  })

Data transfer object
  view => backend
    /avocat/search/name
    {
      name : string
    }
  backend => view
    /avocat/search/name
    {
      avocats : [
        {
          id : int
          name : string
          speciality : string
          city : string
        }
      ]
    }