using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using KinveyKendoWiki.Models;
using KinveyKendoWiki.Common;
using System.Web.Script.Serialization;
using KinveyKendoWiki.Models.EF;

namespace KinveyKendoWiki.Controllers
{
    public class DiagramShapesController : Controller
    {
        public ActionResult Index()
        {
            return this.Jsonp(DiagramShapesRepository.All());
        }

        public JsonResult Update()
        {
            var models = this.DeserializeObject<IEnumerable<OrgChartShape>>("models");
            if (models != null)
            {
                DiagramShapesRepository.Update(models);
            }
            return this.Jsonp(models);
        }

        public ActionResult Destroy()
        {
            var models = this.DeserializeObject<IEnumerable<OrgChartShape>>("models");

            if (models != null)
            {
                DiagramShapesRepository.Delete(models);
            }
            return this.Jsonp(models);
        }

        public ActionResult Create()
        {
            var models = this.DeserializeObject<IEnumerable<OrgChartShape>>("models");
            if (models != null)
            {
                DiagramShapesRepository.Insert(models);
            }
            return this.Jsonp(models);
        }
    }
}
